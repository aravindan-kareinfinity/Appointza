import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { BookedAppoinmentRes } from "@/models/appoinment.model";
import { cn } from "@/lib/utils";

interface ClientServiceHistoryProps {
  appointments: BookedAppoinmentRes[];
}

function statusBadge(status: string) {
  const key = status.toLowerCase();
  if (key === "completed") {
    return (
      <Badge className="h-5 border-transparent bg-emerald-50 px-1.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50">
        Completed
      </Badge>
    );
  }
  if (key === "cancelled") {
    return (
      <Badge className="h-5 border-transparent bg-red-50 px-1.5 text-[10px] font-medium text-red-700 hover:bg-red-50">
        Cancelled
      </Badge>
    );
  }
  return (
    <Badge className="h-5 border-transparent bg-[#eef2ff] px-1.5 text-[10px] font-medium text-[#2a5af5] hover:bg-[#eef2ff]">
      Scheduled
    </Badge>
  );
}

const ClientServiceHistory = ({ appointments }: ClientServiceHistoryProps) => {
  if (!appointments || appointments.length === 0) {
    return (
      <div className="rounded-lg border border-[#e6eaf0] bg-white px-4 py-10 text-center">
        <Calendar className="mx-auto h-8 w-8 text-[#cfd6e0]" aria-hidden />
        <p className="mt-3 text-[13px] font-medium text-[#1a1a1a]">No service history</p>
        <p className="mt-1 text-[12px] text-[#5b6572]">Appointments for this customer will show here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#e6eaf0] bg-white">
      <div className="border-b border-[#e6eaf0] px-3 py-2.5 sm:px-4">
        <p className="text-[13px] font-semibold text-[#1a1a1a]">Service history</p>
        <p className="mt-0.5 text-[12px] text-[#5b6572]">
          {appointments.length} appointment{appointments.length === 1 ? "" : "s"}
        </p>
      </div>
      <ul className="divide-y divide-[#e6eaf0]">
        {appointments.map((appointment) => {
          const services = Array.isArray((appointment as any)?.attributes?.servicelist)
            ? ((appointment as any).attributes.servicelist as Array<{
                servicename: string;
                serviceprice: number;
              }>)
            : [];
          const serviceNames = services.map((s) => s.servicename).filter(Boolean);
          const total = services.reduce((sum, s) => sum + (Number(s.serviceprice) || 0), 0);
          const statusText = appointment.statuscode || "scheduled";
          const staff = appointment.staffname || "";
          const dateObj = new Date(appointment.appoinmentdate);
          const time = appointment.fromtime ? String(appointment.fromtime).slice(0, 5) : "";

          return (
            <li
              key={appointment.id}
              className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-[13px] font-medium text-[#1a1a1a]">
                    {serviceNames.length > 0 ? serviceNames.join(", ") : "Appointment"}
                  </p>
                  {statusBadge(statusText)}
                </div>
                <p className="mt-0.5 text-[12px] text-[#5b6572]">
                  {format(dateObj, "EEE, MMM d, yyyy")}
                  {time ? (
                    <>
                      <span className="text-[#cfd6e0]"> · </span>
                      {time}
                    </>
                  ) : null}
                  {staff ? (
                    <>
                      <span className="text-[#cfd6e0]"> · </span>
                      {staff}
                    </>
                  ) : null}
                </p>
              </div>
              <p
                className={cn(
                  "shrink-0 text-[13px] font-semibold tabular-nums text-[#1a1a1a]",
                  total <= 0 && "text-[#5b6572]",
                )}
              >
                {total > 0 ? `₹${total.toLocaleString()}` : "—"}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ClientServiceHistory;
