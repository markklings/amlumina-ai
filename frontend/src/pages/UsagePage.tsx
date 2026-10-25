import { LuChartColumn } from "react-icons/lu";
import PageHeader from "../components/common/PageHeader";
import ResourceView from "../components/common/ResourceView";
import Skeleton from "../components/common/Skeleton";
import StateView from "../components/common/StateView";
import UsageChart from "../components/usage/UsageChart";
import UsageMeter from "../components/usage/UsageMeter";
import { todayUtc } from "../lib/dates";
// import { mockUsage } from "../mocks/usage";
// import { useMockResource } from "../mocks/useMockResource";
import { useUsage } from "../hooks/useUsage";

export default function UsagePage() {
  const { status, data, refetch } = useUsage();
  const today = data.days.find((d) => d.day === todayUtc()) ?? {
    day: todayUtc(),
    input: 0,
    output: 0,
  };

  return (
    <>
      <PageHeader
        title="Usage"
        description="Tokens used through Lumi with your Gemini key."
      />

      <ResourceView
        status={status}
        onRetry={refetch}
        skeleton={
          <div className="space-y-4">
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        }
        empty={
          <StateView
            icon={LuChartColumn}
            title="No usage yet"
            description="Send a message in chat and your usage will show up here."
          />
        }
      >
        <div className="space-y-4">
          <UsageMeter
            input={today.input}
            output={today.output}
            limit={data.limit}
          />
          <UsageChart days={data.days} limit={data.limit} />
          <p className="text-xs text-zinc-500">
            This is Lumi&apos;s daily guard. Your Gemini key also has its own
            quota with Google, which is separate.
          </p>
        </div>
      </ResourceView>
    </>
  );
}
