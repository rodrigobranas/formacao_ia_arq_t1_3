import type { RouteObject } from "react-router";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
} from "react-router";
import App from "./App";
import DashboardPage from "./pages/DashboardPage";
import OrganizationSettingsPage from "./pages/OrganizationSettingsPage";
import PublicTicketPage from "./pages/PublicTicketPage";
import PublicTicketTrackingPage from "./pages/PublicTicketTrackingPage";
import SigninPage from "./pages/SigninPage";
import SettingsLayout from "./pages/SettingsLayout";
import SignupPage from "./pages/SignupPage";
import TicketTypesPage from "./pages/TicketTypesPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import TicketsPage from "./pages/TicketsPage";
import UsersPage from "./pages/UsersPage";
import { ProtectedRoute } from "./store/AuthContext";

export const appRoutes: RouteObject[] = createRoutesFromElements(
  <>
    <Route element={<SigninPage />} path="/signin" />
    <Route element={<SignupPage />} path="/signup" />
    <Route element={<PublicTicketPage />} path="/:orgSlug/tickets/new" />
    <Route element={<PublicTicketTrackingPage />} path="/:orgSlug/tickets/track" />
    <Route element={<ProtectedRoute />}>
      <Route element={<App />} path="/">
        <Route element={<DashboardPage />} index />
        <Route element={<TicketsPage />} path="tickets" />
        <Route element={<TicketDetailPage />} path="tickets/:id" />
        <Route element={<SettingsLayout />} path="settings">
          <Route element={<Navigate replace to="/settings/ticket-types" />} index />
          <Route element={<TicketTypesPage />} path="ticket-types" />
          <Route element={<UsersPage />} path="users" />
          <Route element={<OrganizationSettingsPage />} path="organization" />
        </Route>
      </Route>
    </Route>
  </>,
);

export const router = createBrowserRouter(appRoutes);
