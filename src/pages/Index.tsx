// Legacy /home route — redirects to the new NASH multi-sport public feed at /.
// Old marketing page components remain in src/components/ for reuse but the
// canonical landing surface is now FeedPage.
import { Navigate } from "react-router-dom";

const Index = () => <Navigate to="/" replace />;

export default Index;
