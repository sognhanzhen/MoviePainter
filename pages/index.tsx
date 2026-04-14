import dynamic from "next/dynamic";

const BrowserApp = dynamic(
  () => import("../client/src/BrowserApp").then((module) => module.BrowserApp),
  {
    ssr: false
  }
);

export default function HomePage() {
  return <BrowserApp />;
}
