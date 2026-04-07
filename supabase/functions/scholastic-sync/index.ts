import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCHOLASTIC_URL = Deno.env.get("SCHOLASTIC_SERVICES_SUPABASE_URL");
const SCHOLASTIC_KEY = Deno.env.get("SCHOLASTIC_SERVICES_SUPABASE_ANON_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!SCHOLASTIC_URL || !SCHOLASTIC_KEY) {
      throw new Error("Scholastic Services credentials not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error("Nexus database credentials not configured");
    }

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nexus = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await nexus.auth.getUser(token);
    if (authError || !claims?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scholastic = createClient(SCHOLASTIC_URL, SCHOLASTIC_KEY);

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "discover";

    if (action === "discover") {
      // Try to discover available tables
      const results: Record<string, any> = {};
      
      const tablesToTry = [
        "schools", "students", "learners", "pupils", "institutions",
        "users", "profiles", "classes", "grades", "teachers",
        "school_profiles", "student_profiles", "enrollments"
      ];

      for (const table of tablesToTry) {
        const { data, error } = await scholastic.from(table).select("*").limit(1);
        if (!error) {
          results[table] = {
            exists: true,
            sampleRow: data?.[0] || null,
            columns: data?.[0] ? Object.keys(data[0]) : [],
          };
        }
      }

      return new Response(JSON.stringify({ tables: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "sync-schools") {
      // Fetch schools from Scholastic Services
      const { data: schools, error: schErr } = await scholastic
        .from("schools")
        .select("*")
        .limit(500);

      if (schErr) {
        // Try alternative table names
        const { data: institutions, error: instErr } = await scholastic
          .from("institutions")
          .select("*")
          .limit(500);

        if (instErr) {
          return new Response(
            JSON.stringify({ error: "Could not find schools table", details: schErr.message }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return await syncSchoolData(nexus, institutions, "institutions");
      }

      return await syncSchoolData(nexus, schools, "schools");
    }

    if (action === "sync-students") {
      // Fetch students from Scholastic Services
      const { data: students, error: stuErr } = await scholastic
        .from("students")
        .select("*")
        .limit(1000);

      if (stuErr) {
        const { data: learners, error: learnErr } = await scholastic
          .from("learners")
          .select("*")
          .limit(1000);

        if (learnErr) {
          return new Response(
            JSON.stringify({ error: "Could not find students table", details: stuErr.message }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return await syncStudentData(nexus, learners, "learners");
      }

      return await syncStudentData(nexus, students, "students");
    }

    if (action === "sync-all") {
      const syncResults: any = { schools: null, students: null };

      // Sync schools
      const { data: schools } = await scholastic.from("schools").select("*").limit(500);
      if (schools?.length) {
        const schoolRes = await syncSchoolData(nexus, schools, "schools");
        syncResults.schools = await schoolRes.json();
      }

      // Sync students
      const { data: students } = await scholastic.from("students").select("*").limit(1000);
      if (students?.length) {
        const studentRes = await syncStudentData(nexus, students, "students");
        syncResults.students = await studentRes.json();
      }

      return new Response(JSON.stringify(syncResults), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use: discover, sync-schools, sync-students, sync-all" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Scholastic sync error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function syncSchoolData(nexus: any, schools: any[], sourceTable: string) {
  let synced = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const school of schools) {
    const name = school.name || school.school_name || school.institution_name || "Unknown School";
    const province = school.province || school.state || school.region || "Unknown";
    const city = school.city || school.town || school.location || province;
    const level = inferLevel(school);

    // Check if team already exists with this school name
    const { data: existing } = await nexus
      .from("teams")
      .select("id")
      .eq("school_name", name)
      .limit(1);

    if (existing?.length) {
      skipped++;
      continue;
    }

    // Create team entry for the school
    const { error: teamErr } = await nexus.from("teams").insert({
      name: name,
      school_name: name,
      discipline: school.sport || school.discipline || "Multi-Sport",
      province: province,
      level: level,
      is_active: true,
    });

    if (teamErr) {
      errors.push(`${name}: ${teamErr.message}`);
      continue;
    }

    // Also create venue if school has location data
    if (school.address || school.city) {
      const { data: existingVenue } = await nexus
        .from("venues")
        .select("id")
        .eq("name", `${name} Grounds`)
        .limit(1);

      if (!existingVenue?.length) {
        await nexus.from("venues").insert({
          name: `${name} Grounds`,
          type: "school",
          city: city,
          province: province,
          address: school.address || null,
          is_active: true,
        });
      }
    }

    synced++;
  }

  return new Response(
    JSON.stringify({
      source: sourceTable,
      total: schools.length,
      synced,
      skipped,
      errors: errors.length ? errors : undefined,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function syncStudentData(nexus: any, students: any[], sourceTable: string) {
  let synced = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const student of students) {
    const firstName = student.first_name || student.firstname || student.name?.split(" ")[0] || "Unknown";
    const lastName = student.last_name || student.lastname || student.surname || student.name?.split(" ").slice(1).join(" ") || "Unknown";
    const province = student.province || student.state || student.region || "Unknown";
    const schoolName = student.school_name || student.school || student.institution || null;
    const dob = student.date_of_birth || student.dob || student.birth_date || null;
    const gender = student.gender || student.sex || null;

    // Check if athlete already exists
    const { data: existing } = await nexus
      .from("athletes")
      .select("id")
      .eq("first_name", firstName)
      .eq("last_name", lastName)
      .eq("province", province)
      .limit(1);

    if (existing?.length) {
      skipped++;
      continue;
    }

    const { error: athErr } = await nexus.from("athletes").insert({
      first_name: firstName,
      last_name: lastName,
      province: province,
      school_name: schoolName,
      date_of_birth: dob,
      gender: gender,
      disciplines: student.disciplines || student.sports || ["General"],
      is_active: true,
    });

    if (athErr) {
      errors.push(`${firstName} ${lastName}: ${athErr.message}`);
      continue;
    }

    synced++;
  }

  return new Response(
    JSON.stringify({
      source: sourceTable,
      total: students.length,
      synced,
      skipped,
      errors: errors.length ? errors : undefined,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function inferLevel(school: any): string {
  const type = (school.type || school.level || school.category || "").toLowerCase();
  if (type.includes("primary") || type.includes("junior")) return "primary_school";
  if (type.includes("secondary") || type.includes("high") || type.includes("senior")) return "secondary_school";
  if (type.includes("college") || type.includes("university")) return "club_academy";
  return "primary_school";
}
