import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthCallbackPage from "../pages/AuthCallbackPage";
import ChatPage from "../pages/ChatPage";
import ClassroomPage from "../pages/ClassroomPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import LibraryPage from "../pages/LibraryPage";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import OnboardingPage from "../pages/OnboardingPage";
import PrivacyPage from "../pages/PrivacyPage";
import ProfilePage from "../pages/ProfilePage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import SessionExpiredPage from "../pages/SessionExpiredPage";
import SignupPage from "../pages/SignupPage";
import TermsPage from "../pages/TermsPage";
import UsagePage from "../pages/UsagePage";
import PlannerPage from "../pages/PlannerPage";
import WorkspaceLayout from "../layouts/WorkspaceLayout";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import CalendarPage from "../pages/CalendarPage";
import LandingPage from "../pages/LandingPage";
import {
  GuestOnly,
  OnboardingOnly,
  RequireAuth,
  RequireOnboarded,
} from "./guards";
import { paths } from "./paths";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path={paths.login} element={<LoginPage />} />
          <Route path={paths.signup} element={<SignupPage />} />
          <Route path={paths.forgot} element={<ForgotPasswordPage />} />
        </Route>

        {/* public */}
        <Route path={paths.reset} element={<ResetPasswordPage />} />
        <Route path={paths.callback} element={<AuthCallbackPage />} />
        <Route path={paths.sessionExpired} element={<SessionExpiredPage />} />
        <Route path={paths.terms} element={<TermsPage />} />
        <Route path={paths.privacy} element={<PrivacyPage />} />

        <Route element={<RequireAuth />}>
          <Route path={paths.verifyEmail} element={<VerifyEmailPage />} />
          <Route element={<OnboardingOnly />}>
            <Route path={paths.onboarding} element={<OnboardingPage />} />
          </Route>
          <Route element={<RequireOnboarded />}>
            <Route path={paths.chat} element={<ChatPage />} />
            <Route element={<WorkspaceLayout />}>
              <Route path={paths.classroom} element={<ClassroomPage />} />
              <Route path={paths.library} element={<LibraryPage />} />
              <Route path={paths.usage} element={<UsagePage />} />
              <Route path={paths.profile} element={<ProfilePage />} />
              <Route path={paths.planner} element={<PlannerPage />} />
              <Route path={paths.calendar} element={<CalendarPage />} />
            </Route>
          </Route>
        </Route>

        <Route path={paths.home} element={<LandingPage />} />
        {/*<Route path="/" element={<Navigate to={paths.chat} replace />} />*/}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
