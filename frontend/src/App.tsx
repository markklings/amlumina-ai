import OfflineBanner from "./components/common/OfflineBanner";
import AppRouter from "./router/AppRouter";

export default function App() {
  return (
    <>
      <AppRouter />
      <OfflineBanner />
    </>
  );
}
