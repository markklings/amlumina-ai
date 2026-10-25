import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuFolderOpen, LuSearchX } from "react-icons/lu";
import PageHeader from "../components/common/PageHeader";
import ResourceView from "../components/common/ResourceView";
import Skeleton from "../components/common/Skeleton";
import StateView from "../components/common/StateView";
import LibraryCard from "../components/library/LibraryCard";
import Button from "../components/ui/Button";
import SearchField from "../components/ui/SearchField";
import Tabs from "../components/ui/Tabs";
import { libraryKinds } from "../constants/libraryKinds";
// import { mockLibrary } from "../mocks/library";
// import { useMockResource } from "../mocks/useMockResource";
import { useLibrary } from "../hooks/useLibrary";
import { paths } from "../router/paths";
import type { LibraryKind } from "../types/library";

type Filter = "all" | LibraryKind;

export default function LibraryPage() {
  const navigate = useNavigate();
  const { status, data, refetch } = useLibrary();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data
      .filter(
        (i) =>
          (filter === "all" || i.kind === filter) &&
          i.title.toLowerCase().includes(q),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data, filter, query]);

  const count = (kind: LibraryKind) =>
    data.filter((i) => i.kind === kind).length;
  const askLumi = (prompt: string) =>
    navigate(paths.chat, { state: { prompt } });

  return (
    <>
      <PageHeader
        title="Library"
        description="Documents, checklists and folders Lumi created for you."
        actions={
          <Button
            size="sm"
            variant="primary"
            onClick={() => askLumi("Create a reviewer document about ")}
          >
            Create with Lumi
          </Button>
        }
      />

      <ResourceView
        status={status}
        onRetry={refetch}
        skeleton={
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-3 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[66px] w-full" />
              ))}
            </div>
          </div>
        }
        empty={
          <StateView
            icon={LuFolderOpen}
            title="Nothing here yet"
            description="Ask Lumi to write a reviewer, make a checklist or set up a folder, and it will show up here."
            action={
              <Button
                variant="primary"
                onClick={() => askLumi("Create a reviewer document about ")}
              >
                Create with Lumi
              </Button>
            }
          />
        }
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs<Filter>
              label="File type"
              value={filter}
              onChange={setFilter}
              tabs={[
                { value: "all", label: "All", count: data.length },
                {
                  value: "doc",
                  label: libraryKinds.doc.label,
                  count: count("doc"),
                },
                {
                  value: "sheet",
                  label: libraryKinds.sheet.label,
                  count: count("sheet"),
                },
                {
                  value: "folder",
                  label: libraryKinds.folder.label,
                  count: count("folder"),
                },
              ]}
            />
            <div className="w-full sm:w-64">
              <SearchField
                value={query}
                onChange={setQuery}
                label="Search the library"
                placeholder="Search"
              />
            </div>
          </div>

          {visible.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {visible.map((item) => (
                <li key={item.id}>
                  <LibraryCard item={item} />
                </li>
              ))}
            </ul>
          ) : (
            <StateView
              icon={LuSearchX}
              title="No matches"
              description="Try a different search or file type."
            />
          )}
        </div>
      </ResourceView>
    </>
  );
}
