import { useParams } from "react-router-dom";
import { LuLink2Off } from "react-icons/lu";
import { publicApi } from "../api/share.api";
import ResourceView from "../components/common/ResourceView";
import Skeleton from "../components/common/Skeleton";
import StateView from "../components/common/StateView";
import { useResource } from "../hooks/useResource";
import PublicLayout from "../layouts/PublicLayout";
import { formatDate } from "../lib/dates";

const EMPTY = { title: "", html: "", updatedAt: "" };

export default function PublicDocPage() {
  const { token = "" } = useParams();
  const { status, data, refetch } = useResource(
    (s) => publicApi.doc(token, s),
    EMPTY,
    undefined,
    token,
  );

  return (
    <PublicLayout>
      <ResourceView
        status={status === "error" ? "empty" : status}
        onRetry={refetch}
        skeleton={<Skeleton className="h-96 w-full" />}
        empty={
          <StateView
            icon={LuLink2Off}
            title="This link is not available"
            description="It may be invalid, or the owner turned sharing off."
          />
        }
      >
        <article>
          <h1 className="text-3xl font-semibold tracking-tight">
            {data.title}
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Updated {data.updatedAt && formatDate(data.updatedAt)} · View only
          </p>
          {/* the server sanitizes this HTML before it is ever stored or returned */}
          <div
            className="doc-content mt-8"
            dangerouslySetInnerHTML={{ __html: data.html }}
          />
        </article>
      </ResourceView>
    </PublicLayout>
  );
}
