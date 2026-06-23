"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Pencil,
  Search,
  Trash2,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/hooks/use-session";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string;
};

type PatientPage = {
  data: Patient[];
  page: number;
  limit: number;
  total: number;
};

type SortField = "lastName" | "dateOfBirth" | "email";
type SortOrder = "asc" | "desc";

const PAGE_SIZE = 10;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function PatientsSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="h-11 border-b bg-muted/40" />
      {Array.from({ length: 7 }, (_, index) => (
        <div
          className="grid h-16 grid-cols-[2fr_1.2fr_2fr_6rem] items-center gap-6 border-b px-6 last:border-0"
          key={index}
        >
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-7 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function PatientsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: sessionLoading, role } = useSession();
  const [patients, setPatients] = useState<PatientPage>();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>("lastName");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadPatients = useCallback(
    async (signal?: AbortSignal) => {
      if (sessionLoading) return;

      setLoading(true);
      setError(undefined);

      try {
        if (!isAuthenticated) {
          setError("Your session is missing. Sign in again to view patients.");
          return;
        }

        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          sortBy,
          sortOrder,
        });
        if (debouncedSearch.trim()) {
          params.set("search", debouncedSearch.trim());
        }

        const response = await fetch(`/api/patients?${params}`, {
          signal,
        });
        const body = (await response.json().catch(() => ({}))) as
          | PatientPage
          | { message?: string };

        if (!response.ok) {
          throw new Error(
            "message" in body && body.message
              ? body.message
              : "Patients could not be loaded.",
          );
        }

        setPatients(body as PatientPage);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Patients could not be loaded.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [debouncedSearch, isAuthenticated, page, sessionLoading, sortBy, sortOrder],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadPatients(controller.signal));
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadPatients]);

  function changeSort(field: SortField) {
    setPage(1);
    if (field === sortBy) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }

  async function deletePatient(patient: Patient) {
    if (!window.confirm(`Delete ${patient.firstName} ${patient.lastName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? "The patient could not be deleted.");
      }

      if (patients?.data.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadPatients();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The patient could not be deleted.",
      );
    }
  }

  const totalPages = Math.max(1, Math.ceil((patients?.total ?? 0) / PAGE_SIZE));
  const isAdmin = role === "admin";

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <UsersRound className="size-4" />
              Patient management
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Patients</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Search, review, and manage patient records.
            </p>
          </div>
          {isAdmin && (
            <Button asChild size="lg">
              <Link href="/patients/new">
                <UserRoundPlus data-icon="inline-start" />
                Add patient
              </Link>
            </Button>
          )}
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <span className="sr-only">Search patients</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email..."
              type="search"
              value={search}
            />
          </label>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {patients
              ? `${patients.total} patient${patients.total === 1 ? "" : "s"}`
              : "Loading patients"}
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
            <CircleAlert className="mx-auto size-9 text-destructive" />
            <h2 className="mt-4 text-base font-semibold">
              We couldn&apos;t load patients
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {error}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={() => void loadPatients()}>Try again</Button>
              <Button asChild variant="outline">
                <a href="http://localhost:3000/docs" target="_blank">
                  API status
                </a>
              </Button>
            </div>
          </div>
        ) : loading ? (
          <PatientsSkeleton />
        ) : patients?.data.length ? (
          <>
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <SortableHead
                      active={sortBy === "lastName"}
                      direction={sortOrder}
                      onClick={() => changeSort("lastName")}
                    >
                      Patient
                    </SortableHead>
                    <SortableHead
                      active={sortBy === "dateOfBirth"}
                      direction={sortOrder}
                      onClick={() => changeSort("dateOfBirth")}
                    >
                      Date of birth
                    </SortableHead>
                    <SortableHead
                      active={sortBy === "email"}
                      direction={sortOrder}
                      onClick={() => changeSort("email")}
                    >
                      Email
                    </SortableHead>
                    {isAdmin && (
                      <TableHead className="w-24 pr-4 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.data.map((patient) => (
                    <TableRow
                      className="group cursor-pointer"
                      key={patient.id}
                      onClick={() => router.push(`/patients/${patient.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          router.push(`/patients/${patient.id}`);
                        }
                      }}
                      tabIndex={0}
                    >
                      <TableCell className="px-4 py-4">
                        <div className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          ID: {patient.id}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-muted-foreground">
                        {formatDate(patient.dateOfBirth)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-muted-foreground">
                        {patient.email ?? "—"}
                      </TableCell>
                      {isAdmin && (
                        <TableCell
                          className="px-4 py-4"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex justify-end gap-1">
                            <Button
                              aria-label={`Edit ${patient.firstName} ${patient.lastName}`}
                              asChild
                              size="icon-sm"
                              variant="ghost"
                            >
                              <Link href={`/patients/${patient.id}/edit`}>
                                <Pencil />
                              </Link>
                            </Button>
                            <Button
                              aria-label={`Delete ${patient.firstName} ${patient.lastName}`}
                              onClick={() => void deletePatient(patient)}
                              size="icon-sm"
                              variant="destructive"
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {patients.page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  variant="outline"
                >
                  <ChevronLeft data-icon="inline-start" />
                  Previous
                </Button>
                <Button
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  variant="outline"
                >
                  Next
                  <ChevronRight data-icon="inline-end" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-muted">
              <UsersRound className="size-5 text-muted-foreground" />
            </div>
            <h2 className="mt-4 font-semibold">
              {debouncedSearch ? "No patients found" : "No patients yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {debouncedSearch
                ? "Try another name or email address."
                : "Patient records will appear here once they are added."}
            </p>
            {debouncedSearch ? (
              <Button className="mt-6" onClick={() => setSearch("")} variant="outline">
                Clear search
              </Button>
            ) : (
              isAdmin && (
                <Button asChild className="mt-6">
                  <Link href="/patients/new">Add first patient</Link>
                </Button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SortableHead({
  active,
  children,
  direction,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  direction: SortOrder;
  onClick: () => void;
}) {
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead className="px-4">
      <button
        className="-ml-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium hover:bg-muted"
        onClick={onClick}
        type="button"
      >
        {children}
        <Icon className="size-3.5 text-muted-foreground" />
      </button>
    </TableHead>
  );
}
