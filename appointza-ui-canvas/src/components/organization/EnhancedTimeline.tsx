import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, FileText, Clock, User, Image as ImageIcon, File, Eye, Plus, Loader2, Upload, X, Pencil, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { BookedAppoinmentRes, SearchAppointmentByMobileReq } from "@/models/appoinment.model";
import { AppointmentRecord } from "@/models/appointmentrecord.model";
import { AppointmentRecordService } from "@/services/appointmentrecord.service";
import CreateAppointmentTaskValueDialog from "@/components/organization/CreateAppointmentTaskValueDialog";
import type { ReferenceValue } from "@/models/referencevalue.model";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { ReferenceTypeService } from "@/services/referencetype.service";
import { AppoinmentService } from "@/services/appoinment.service";
import { UsersService } from "@/services/users.service";
import { UsersSelectReq } from "@/models/users.model";
import {
  loadAppointmentTaskValues,
  parseDataTypeFromNotes,
} from "@/utils/appointmentTaskValues.util";
import { ResponsiveEditSheet } from "@/components/organization/ResponsiveEditSheet";
import { useState, useEffect, useMemo, useCallback } from "react";
import { FilesService } from "@/services/files.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

interface EnhancedTimelineProps {
  appointments: BookedAppoinmentRes[];
  appointmentRecords: AppointmentRecord[];
  userId: number;
  organizationId: number;
  clientMobile?: string;
  openAddRecordRequest?: number;
  onRecordAdded?: () => void;
  onRequireClientRegistration?: () => void;
}

interface TimelineItem {
  id: string;
  type: "appointment" | "record" | "separator";
  title: string;
  description: string;
  timestamp: Date;
  staff?: string;
  date?: Date;
  appointment?: BookedAppoinmentRes;
  record?: AppointmentRecord;
}

const EnhancedTimeline = ({
  appointments,
  appointmentRecords,
  userId,
  organizationId,
  clientMobile = "",
  openAddRecordRequest = 0,
  onRecordAdded,
  onRequireClientRegistration,
}: EnhancedTimelineProps) => {
  const filesService = useMemo(() => new FilesService(), []);
  const appointmentRecordService = useMemo(() => new AppointmentRecordService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const referenceTypeService = useMemo(() => new ReferenceTypeService(), []);
  const appointmentService = useMemo(() => new AppoinmentService(), []);
  const usersService = useMemo(() => new UsersService(), []);
  const { toast } = useToast();
  const { user } = useAuth();
  const [imageUrls, setImageUrls] = useState<{ [key: number]: string }>({});
  const [selectedImage, setSelectedImage] = useState<{ id: number; url: string; filename: string } | null>(null);
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
  
  // Add record dialog state
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [report, setReport] = useState("");
  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState<ReferenceValue[]>([]);
  const [taskValues, setTaskValues] = useState<{ [key: number]: any }>({});
  const [uploadedFiles, setUploadedFiles] = useState<AppointmentRecord.FileIdItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AppointmentRecord | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isCreateValueOpen, setIsCreateValueOpen] = useState(false);

  const reloadTasks = useCallback(async () => {
    if (organizationId <= 0) return [];
    setIsLoadingTasks(true);
    try {
      const taskList = await loadAppointmentTaskValues(
        referenceTypeService,
        referenceValueService,
        organizationId,
      );
      setTasks(taskList);
      return taskList;
    } catch (error) {
      console.error("Error loading appointment task values:", error);
      setTasks([]);
      return [];
    } finally {
      setIsLoadingTasks(false);
    }
  }, [organizationId, referenceTypeService, referenceValueService]);

  const handleAppointmentValueCreated = async (created: ReferenceValue) => {
    await reloadTasks();
    if (created.id) {
      setTaskValues((prev) => ({
        ...prev,
        [created.id]: prev[created.id] ?? "",
      }));
    }
  };

  const resolveRecordUserId = useCallback(async (): Promise<number> => {
    if (userId > 0) return userId;

    const mobile = clientMobile.trim();
    if (!mobile) return 0;

    try {
      const userReq = new UsersSelectReq();
      userReq.mobile = mobile;
      userReq.organisationid = organizationId;
      const users = await usersService.select(userReq);
      const matched = (users || []).find(
        (u) => (u.mobile || "").replace(/\D/g, "") === mobile.replace(/\D/g, ""),
      );
      if (matched?.id) return Number(matched.id);
    } catch (error) {
      console.error("Error resolving user by mobile:", error);
    }

    try {
      const searchReq = new SearchAppointmentByMobileReq();
      searchReq.organisationid = organizationId;
      searchReq.mobilenumber = mobile;
      const results = await appointmentService.searchByMobile(searchReq);
      if (results?.[0]?.userid) return Number(results[0].userid);
    } catch (error) {
      console.error("Error resolving user from appointments:", error);
    }

    return 0;
  }, [appointmentService, clientMobile, organizationId, userId, usersService]);

  useEffect(() => {
    void reloadTasks();
  }, [reloadTasks]);

  const taskLabelById = useMemo(() => {
    const map: Record<number, string> = {};
    tasks.forEach((t) => {
      if (t?.id) {
        map[t.id] = t.displaytext || t.identifier || String(t.id);
      }
    });
    return map;
  }, [tasks]);

  // Load images for all files in appointment records
  useEffect(() => {
    const loadAllImages = async () => {
      const imageIds: number[] = [];
      appointmentRecords.forEach((record) => {
        if (record.fileids?.files && record.fileids.files.length > 0) {
          record.fileids.files.forEach((file) => {
            if (file.filetype?.startsWith("image/") && file.id) {
              imageIds.push(file.id);
            }
          });
        }
        // Also check imageids array
        if (record.imageids && record.imageids.length > 0) {
          imageIds.push(...record.imageids);
        }
      });

      // Load images in batches
      const userContext = localStorage.getItem("user_context");
      let authHeaders: Record<string, string> = {};

      if (userContext) {
        const userData = JSON.parse(userContext);
        const token = userData.accesstoken;
        if (token) {
          authHeaders["Authorization"] = `Bearer ${token}`;
        }
      }

      for (const fileId of imageIds) {
        if (imageUrls[fileId]) continue; // Already loaded
        
        setLoadingImages((prev) => new Set(prev).add(fileId));
        try {
          const imageUrl = filesService.getImageUrl(fileId);
          const response = await fetch(imageUrl, {
            method: "GET",
            headers: {
              Accept: "image/*",
              ...authHeaders,
            },
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setImageUrls((prev) => ({ ...prev, [fileId]: url }));
          } else {
            setImageUrls((prev) => ({ ...prev, [fileId]: imageUrl }));
          }
        } catch (error) {
          setImageUrls((prev) => ({ ...prev, [fileId]: filesService.getImageUrl(fileId) }));
        } finally {
          setLoadingImages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(fileId);
            return newSet;
          });
        }
      }
    };

    if (appointmentRecords.length > 0) {
      loadAllImages();
    }
  }, [appointmentRecords, filesService]);

  const handleViewImage = (file: AppointmentRecord.FileIdItem) => {
    const imageUrl = imageUrls[file.id];
    if (imageUrl) {
      setSelectedImage({ id: file.id, url: imageUrl, filename: file.filename });
    } else {
      const url = filesService.getImageUrl(file.id);
      setSelectedImage({ id: file.id, url: url, filename: file.filename });
    }
  };

  const handleOpenAddRecord = async () => {
    const effectiveUserId = await resolveRecordUserId();
    if (effectiveUserId <= 0) {
      toast({
        title: "Register client first",
        description:
          "This guest needs a customer account before you can add an appointment record. Use On-Spot Registration.",
        variant: "destructive",
      });
      onRequireClientRegistration?.();
      return;
    }

    setSelectedDate(new Date());
    setReport("");
    setNotes("");
    setTaskValues({});
    setUploadedFiles([]);
    setEditingRecord(null);
    setIsAddRecordOpen(true);
  };

  useEffect(() => {
    if (openAddRecordRequest > 0) {
      void handleOpenAddRecord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trigger only when parent requests open
  }, [openAddRecordRequest]);

  const handleOpenEditRecord = (record: AppointmentRecord) => {
    const recordDate = parseDateFromApi(record.appointmentdate);
    setSelectedDate(recordDate);
    setReport(record.record?.report || "");
    setNotes(record.record?.notes || "");
    setTaskValues((record.record?.additionalData as any) || {});
    setUploadedFiles(record.fileids?.files || []);
    setEditingRecord(record);
    setIsAddRecordOpen(true);
  };

  const handleCloseAddRecord = useCallback(() => {
    setIsAddRecordOpen(false);
    setEditingRecord(null);
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const fileArray = Array.from(files);
      const fileIds = await filesService.upload(fileArray);

      if (fileIds && fileIds.length > 0) {
        const newFileItems: AppointmentRecord.FileIdItem[] = fileArray.map((file, index) => ({
          id: fileIds[index],
          filename: file.name,
          filepath: "",
          filetype: file.type,
          filesize: file.size,
          uploadedon: new Date(),
          uploadedby: user?.username || "User",
        }));

        setUploadedFiles((prev) => [...prev, ...newFileItems]);
        await loadImageUrls(newFileItems);

        toast({
          title: "Success",
          description: `${fileArray.length} file(s) uploaded successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const loadImageUrls = async (files: AppointmentRecord.FileIdItem[]) => {
    const userContext = localStorage.getItem("user_context");
    let authHeaders: Record<string, string> = {};

    if (userContext) {
      const userData = JSON.parse(userContext);
      const token = userData.accesstoken;
      if (token) {
        authHeaders["Authorization"] = `Bearer ${token}`;
      }
    }

    const imageUrlPromises = files
      .filter((file) => file.filetype?.startsWith("image/"))
      .map(async (file) => {
        try {
          const imageUrl = filesService.getImageUrl(file.id);
          const response = await fetch(imageUrl, {
            method: "GET",
            headers: {
              Accept: "image/*",
              ...authHeaders,
            },
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            return { fileId: file.id, url };
          } else {
            return { fileId: file.id, url: imageUrl };
          }
        } catch (error) {
          return { fileId: file.id, url: filesService.getImageUrl(file.id) };
        }
      });

    const results = await Promise.all(imageUrlPromises);
    const urlMap: { [key: number]: string } = {};
    results.forEach((result) => {
      urlMap[result.fileId] = result.url;
    });
    setImageUrls((prev) => ({ ...prev, ...urlMap }));
  };

  const handleTaskValueChange = (taskId: number, value: any) => {
    setTaskValues((prev) => ({
      ...prev,
      [taskId]: value,
    }));
  };

  const renderTaskInput = (task: ReferenceValue) => {
    const currentValue = taskValues[task.id] !== undefined ? taskValues[task.id] : "";
    const { datatype: rawType } = parseDataTypeFromNotes(task.notes || "");
    const datatype = rawType.toLowerCase();

    switch (datatype) {
      case "number":
        return (
          <NumberInput
            float
            value={typeof currentValue === "number" ? currentValue : 0}
            onValueChange={(value) => handleTaskValueChange(task.id, value)}
            placeholder="Enter number"
          />
        );
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={currentValue || false}
              onChange={(e) => handleTaskValueChange(task.id, e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-muted-foreground">
              {currentValue ? "Yes" : "No"}
            </span>
          </div>
        );
      case "date":
        // Format date value for input (YYYY-MM-DD)
        // Handle various input formats and convert to YYYY-MM-DD
        let dateValue = "";
        if (currentValue) {
          if (currentValue instanceof Date) {
            // Extract date components to avoid timezone issues
            const year = currentValue.getFullYear();
            const month = String(currentValue.getMonth() + 1).padStart(2, '0');
            const day = String(currentValue.getDate()).padStart(2, '0');
            dateValue = `${year}-${month}-${day}`;
          } else if (typeof currentValue === 'string') {
            // If it's already in YYYY-MM-DD format, use it directly
            if (/^\d{4}-\d{2}-\d{2}$/.test(currentValue)) {
              dateValue = currentValue;
            } else if (currentValue.includes('T')) {
              // Parse ISO string and extract date components
              const date = new Date(currentValue);
              if (!isNaN(date.getTime())) {
                const year = date.getUTCFullYear();
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const day = String(date.getUTCDate()).padStart(2, '0');
                dateValue = `${year}-${month}-${day}`;
              }
            } else {
              dateValue = currentValue;
            }
          }
        }
        return (
          <Input
            type="date"
            value={dateValue}
            onChange={(e) => {
              // Store as YYYY-MM-DD string to avoid timezone issues
              handleTaskValueChange(task.id, e.target.value || "");
            }}
            placeholder="Select date"
          />
        );
      case "datetime":
        // Format datetime value for input (YYYY-MM-DDTHH:mm)
        // datetime-local expects format: YYYY-MM-DDTHH:mm
        let datetimeValue = "";
        if (currentValue) {
          if (currentValue instanceof Date) {
            // Format as YYYY-MM-DDTHH:mm for datetime-local input
            const year = currentValue.getFullYear();
            const month = String(currentValue.getMonth() + 1).padStart(2, '0');
            const day = String(currentValue.getDate()).padStart(2, '0');
            const hours = String(currentValue.getHours()).padStart(2, '0');
            const minutes = String(currentValue.getMinutes()).padStart(2, '0');
            datetimeValue = `${year}-${month}-${day}T${hours}:${minutes}`;
          } else if (typeof currentValue === 'string') {
            if (currentValue.includes('T')) {
              // Parse and format ISO string
              const date = new Date(currentValue);
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                datetimeValue = `${year}-${month}-${day}T${hours}:${minutes}`;
              }
            } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(currentValue)) {
              // Already in correct format
              datetimeValue = currentValue;
            }
          }
        }
        return (
          <Input
            type="datetime-local"
            value={datetimeValue}
            onChange={(e) => {
              // Store as ISO string for consistency
              if (e.target.value) {
                const datetime = new Date(e.target.value);
                handleTaskValueChange(task.id, !isNaN(datetime.getTime()) ? datetime.toISOString() : "");
              } else {
                handleTaskValueChange(task.id, "");
              }
            }}
            placeholder="Select date and time"
          />
        );
      case "time":
        // Format time value for input (HH:mm)
        const timeValue = currentValue
          ? (currentValue instanceof Date
              ? format(currentValue, "HH:mm")
              : typeof currentValue === 'string'
              ? (currentValue.includes(':')
                  ? currentValue.substring(0, 5) // Extract HH:mm from HH:mm:ss
                  : currentValue)
              : currentValue)
          : "";
        return (
          <Input
            type="time"
            value={timeValue}
            onChange={(e) => handleTaskValueChange(task.id, e.target.value || "")}
            placeholder="Select time"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={currentValue || ""}
            onChange={(e) => handleTaskValueChange(task.id, e.target.value)}
            placeholder="Enter value"
          />
        );
    }
  };

  const handleRemoveFile = (fileId: number) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
    setImageUrls((prev) => {
      const newUrls = { ...prev };
      delete newUrls[fileId];
      return newUrls;
    });
  };

  // Convert date for API to avoid timezone conversion issues
  const sendToApi = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    // Create UTC date with the same year, month, day but at midnight UTC
    // This ensures the date components (year, month, day) are preserved
    const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return utcDate;
  };

  // Parse date from database/API to avoid timezone conversion issues
  // Extracts date components directly from string to preserve exact date
  const parseDateFromApi = (dateValue: Date | string): Date => {
    if (!dateValue) {
      return new Date();
    }
    
    // If it's already a Date object, extract components
    if (dateValue instanceof Date) {
      const year = dateValue.getUTCFullYear();
      const month = dateValue.getUTCMonth();
      const day = dateValue.getUTCDate();
      // Create a local date with the same year, month, day at midnight local time
      return new Date(year, month, day, 0, 0, 0, 0);
    }
    
    // If it's a string, parse it directly to avoid timezone conversion
    if (typeof dateValue === 'string') {
      // Handle format: "2026-01-07T00:00:00" or "2026-01-07" or "2026-01-07T00:00:00Z"
      // Extract date components directly from string
      const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateMatch[3], 10);
        // Create a local date with the exact year, month, day at midnight local time
        // This preserves the date exactly as stored in the database
        return new Date(year, month, day, 0, 0, 0, 0);
      }
      
      // Fallback: Try to parse as Date and extract UTC components
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const day = date.getUTCDate();
        // Create a local date with the same year, month, day at midnight local time
        return new Date(year, month, day, 0, 0, 0, 0);
      }
    }
    
    return new Date();
  };

  const handleSaveRecord = async () => {
    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Please select an appointment date",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const effectiveUserId = editingRecord?.userid || (await resolveRecordUserId());
      if (effectiveUserId <= 0) {
        toast({
          title: "Register client first",
          description:
            "This guest needs a customer account before you can save an appointment record.",
          variant: "destructive",
        });
        onRequireClientRegistration?.();
        return;
      }

      const newRecord = new AppointmentRecord();
      newRecord.id = editingRecord?.id || 0;
      newRecord.userid = effectiveUserId;
      newRecord.organisationid = organizationId;
      // Convert date to UTC to avoid timezone conversion issues (day - 1 problem)
      newRecord.appointmentdate = sendToApi(selectedDate);
      newRecord.status = editingRecord?.status ?? 0;
      newRecord.ishasreschedule = editingRecord?.ishasreschedule ?? false;
      
      // Set record data
      newRecord.record = new AppointmentRecord.RecordData();
      newRecord.record.report = report || "";
      newRecord.record.notes = notes || "";
      newRecord.record.additionalData = taskValues;

      // Set fileids
      newRecord.fileids = new AppointmentRecord.FileIdsData();
      newRecord.fileids.files = uploadedFiles;

      // Set imageids from uploaded files
      newRecord.imageids = uploadedFiles
        .filter((f) => f.filetype?.startsWith("image/"))
        .map((f) => f.id);

      if (newRecord.id && newRecord.id > 0) {
        await appointmentRecordService.update(newRecord);
      } else {
        await appointmentRecordService.save(newRecord);
      }

      toast({
        title: "Success",
        description: editingRecord ? "Appointment record updated successfully" : "Appointment record saved successfully",
      });

      setIsAddRecordOpen(false);
      setEditingRecord(null);
      if (onRecordAdded) {
        onRecordAdded();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: editingRecord ? "Failed to update appointment record" : "Failed to save appointment record",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-3.5 w-3.5 text-[#2a5af5]" />;
      case "record":
        return <FileText className="h-3.5 w-3.5 text-emerald-600" />;
      case "separator":
        return <Calendar className="h-3.5 w-3.5 text-[#9aa3af]" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-[#9aa3af]" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "appointment":
        return (
          <Badge className="h-5 border-transparent bg-[#eef2ff] px-1.5 text-[10px] font-medium text-[#2a5af5] hover:bg-[#eef2ff]">
            Appointment
          </Badge>
        );
      case "record":
        return (
          <Badge className="h-5 border-transparent bg-emerald-50 px-1.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50">
            Record
          </Badge>
        );
      default:
        return null;
    }
  };

  // Build timeline
  const buildTimeline = (): TimelineItem[] => {
    const timelineItems: TimelineItem[] = [];

    // Group items by date
    const itemsByDate = new Map<string, Array<{
      type: "appointment" | "record";
      item: BookedAppoinmentRes | AppointmentRecord;
      date: Date;
    }>>();

    // Add appointments
    appointments.forEach((apt) => {
      const date = parseDateFromApi(apt.appoinmentdate);
      if (isNaN(date.getTime())) {
        return; // Skip invalid dates
      }
      date.setHours(0, 0, 0, 0);
      // Use local date components for dateKey to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!itemsByDate.has(dateKey)) {
        itemsByDate.set(dateKey, []);
      }
      itemsByDate.get(dateKey)!.push({ type: "appointment", item: apt, date });
    });

    // Add appointment records - ALWAYS add them, even if no matching appointment date
    appointmentRecords.forEach((record) => {
      const date = parseDateFromApi(record.appointmentdate);
      if (isNaN(date.getTime())) {
        return;
      }
      
      date.setHours(0, 0, 0, 0);
      // Use local date components for dateKey to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!itemsByDate.has(dateKey)) {
        itemsByDate.set(dateKey, []);
      }
      itemsByDate.get(dateKey)!.push({ type: "record", item: record, date });
    });

    // Sort dates descending (newest first)
    const sortedDates = Array.from(itemsByDate.keys()).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    sortedDates.forEach((dateKey, dateIndex) => {
      // Parse dateKey (YYYY-MM-DD) directly to avoid timezone conversion
      const [year, month, day] = dateKey.split('-').map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);
      if (isNaN(date.getTime())) {
        return; // Skip invalid dates
      }
      const items = itemsByDate.get(dateKey)!;
      
      // Add date separator
      timelineItems.push({
        id: `separator-${dateKey}`,
        type: "separator",
        title: format(date, "EEEE, MMMM do, yyyy"),
        description: "",
        timestamp: date,
        date: date
      });

      // Sort items by time (if available) or creation time
      items.sort((a, b) => {
        if (a.type === "appointment" && b.type === "appointment") {
          const aTime = (a.item as BookedAppoinmentRes).fromtime || "";
          const bTime = (b.item as BookedAppoinmentRes).fromtime || "";
          return String(aTime).localeCompare(String(bTime));
        }
        if (a.type === "record" && b.type === "record") {
          const aTime = (a.item as AppointmentRecord).createdon;
          const bTime = (b.item as AppointmentRecord).createdon;
          return aTime.getTime() - bTime.getTime();
        }
        // Appointments come before records
        if (a.type === "appointment") return -1;
        return 1;
      });

      // Add appointment items
      items.forEach((item, itemIndex) => {
        if (item.type === "appointment") {
          const apt = item.item as BookedAppoinmentRes;
          const services = Array.isArray((apt as any)?.attributes?.servicelist)
            ? (apt as any).attributes.servicelist
            : [];
          const serviceNames = services.map((s: any) => s.servicename).join(", ") || "Appointment";
          
          const aptDate = parseDateFromApi(apt.appoinmentdate);
          if (!isNaN(aptDate.getTime())) {
            timelineItems.push({
              id: `appointment-${apt.id}-${dateIndex}-${itemIndex}`,
              type: "appointment",
              title: `Appointment: ${serviceNames}`,
              description: `Status: ${apt.statuscode || "Scheduled"} | Staff: ${apt.staffname || "N/A"} | Time: ${apt.fromtime || "N/A"}`,
              timestamp: aptDate,
              staff: apt.staffname || "",
              appointment: apt
            });
          }
        } else if (item.type === "record") {
          const record = item.item as AppointmentRecord;
          const hasReport = record.record?.report && record.record.report.trim().length > 0;
          const hasNotes = record.record?.notes && record.record.notes.trim().length > 0;
          const hasFiles = record.fileids?.files && record.fileids.files.length > 0;
          const hasImageIds = record.imageids && record.imageids.length > 0;
          const taskCount = record.record?.additionalData ? Object.keys(record.record.additionalData).length : 0;
          
          const descriptions: string[] = [];
          if (hasReport) descriptions.push("Report");
          if (hasNotes) descriptions.push("Notes");
          if (hasFiles) descriptions.push(`${record.fileids.files.length} file(s)`);
          if (hasImageIds) descriptions.push(`${record.imageids.length} image(s)`);
          if (taskCount > 0) descriptions.push(`${taskCount} task(s)`);
          
          // Parse appointment date correctly to avoid timezone issues
          const recordAppointmentDate = parseDateFromApi(record.appointmentdate);
          timelineItems.push({
            id: `record-${record.id}-${dateIndex}-${itemIndex}`,
            type: "record",
            title: `Appointment Record #${record.id}`,
            description: descriptions.length > 0 ? descriptions.join(" • ") : "Record created (no data yet)",
            timestamp: record.createdon || record.modifiedon || recordAppointmentDate,
            record: record
          });
        }
      });
    });

    return timelineItems;
  };

  const timeline = buildTimeline();

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-[#e6eaf0] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#e6eaf0] px-3 py-2.5 sm:px-4">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#1a1a1a]">Timeline</p>
            <p className="mt-0.5 text-[12px] text-[#5b6572]">Appointments and records</p>
          </div>
          <Button
            type="button"
            onClick={() => void handleOpenAddRecord()}
            size="sm"
            className={cn(org.btnPrimary, "h-8 shrink-0")}
          >
            <Plus className="h-3.5 w-3.5" />
            Add record
          </Button>
        </div>

        <div className="p-3 sm:p-4">
          {!isLoadingTasks && tasks.length === 0 ? (
            <div className="mb-3 rounded-md border border-dashed border-[#e6eaf0] bg-[#f8fafc] px-3 py-2.5 text-[12px] text-[#5b6572]">
              <div className="flex items-start gap-2">
                <Settings2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2a5af5]" />
                <div>
                  <p className="font-medium text-[#1a1a1a]">No appointment fields configured</p>
                  <p className="mt-0.5">Create fields here — same as Profile → Appointment values.</p>
                  <Button
                    type="button"
                    variant="link"
                    className="mt-1 h-auto p-0 text-[12px] text-[#2a5af5]"
                    onClick={() => setIsCreateValueOpen(true)}
                  >
                    Create reference value
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {timeline.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="mx-auto h-7 w-7 text-[#cfd6e0]" aria-hidden />
              <p className="mt-2 text-[13px] font-medium text-[#1a1a1a]">No timeline entries yet</p>
              <p className="mt-0.5 text-[12px] text-[#5b6572]">Bookings and records will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeline.map((item, index) => {
                if (item.type === "separator") {
                  return (
                    <div key={item.id} className="flex items-center gap-2 pt-1">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#e6eaf0] bg-[#f8fafc]">
                        {getTypeIcon(item.type)}
                      </div>
                      <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#5b6572]">
                        {item.title}
                      </h3>
                    </div>
                  );
                }

                return (
                  <div key={item.id} className="relative">
                    {index < timeline.length - 1 && timeline[index + 1].type !== "separator" ? (
                      <div
                        className="absolute left-3 top-7 w-px bg-[#e6eaf0]"
                        style={{ height: "calc(100% - 0.25rem)" }}
                      />
                    ) : null}

                    <div className="flex gap-2.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#e6eaf0] bg-white">
                        {getTypeIcon(item.type)}
                      </div>

                      <div className="min-w-0 flex-1 rounded-md border border-[#e6eaf0] bg-[#f8fafc] p-2.5 sm:p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h4 className="min-w-0 flex-1 text-[13px] font-medium text-[#1a1a1a]">
                            {item.title}
                          </h4>
                          {getTypeBadge(item.type)}
                        </div>

                        <p className="mt-0.5 text-[12px] text-[#5b6572]">{item.description}</p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#9aa3af]">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" aria-hidden />
                            {format(item.timestamp, "h:mm a")}
                          </span>
                          {item.staff ? (
                            <span className="inline-flex items-center gap-1">
                              <User className="h-3 w-3" aria-hidden />
                              {item.staff}
                            </span>
                          ) : null}
                        </div>

                        {item.record ? (
                          <div className="mt-2.5 space-y-2.5 border-t border-[#e6eaf0] pt-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[11px] text-[#9aa3af]">
                                #{item.record.id}
                                {" · "}
                                {(() => {
                                  const appointmentDate = parseDateFromApi(item.record.appointmentdate);
                                  return !isNaN(appointmentDate.getTime())
                                    ? format(appointmentDate, "MMM d, yyyy")
                                    : "—";
                                })()}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className={cn(org.btnOutline, "h-7 px-2 text-[12px]")}
                                onClick={() => handleOpenEditRecord(item.record!)}
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </Button>
                            </div>

                            <div>
                              <p className={cn(org.label, "mb-1")}>Report</p>
                              <div className="rounded-md border border-[#e6eaf0] bg-white px-2.5 py-2 text-[12px] text-[#1a1a1a] whitespace-pre-wrap">
                                {item.record.record?.report || (
                                  <span className="italic text-[#9aa3af]">No report</span>
                                )}
                              </div>
                            </div>

                            <div>
                              <p className={cn(org.label, "mb-1")}>Notes</p>
                              <div className="rounded-md border border-[#e6eaf0] bg-white px-2.5 py-2 text-[12px] text-[#1a1a1a] whitespace-pre-wrap">
                                {item.record.record?.notes || (
                                  <span className="italic text-[#9aa3af]">No notes</span>
                                )}
                              </div>
                            </div>

                            <div>
                              <p className={cn(org.label, "mb-1")}>Tasks</p>
                              {item.record.record?.additionalData &&
                              Object.keys(item.record.record.additionalData).length > 0 ? (
                                <div className="space-y-1.5">
                                  {Object.entries(item.record.record.additionalData).map(
                                    ([key, value], idx) => (
                                      <div
                                        key={idx}
                                        className="rounded-md border border-[#e6eaf0] bg-white px-2.5 py-2"
                                      >
                                        <p className="text-[11px] font-medium text-[#5b6572]">
                                          {(() => {
                                            const id = Number(key);
                                            return Number.isFinite(id)
                                              ? taskLabelById[id] || key
                                              : key;
                                          })()}
                                        </p>
                                        <p className="mt-0.5 text-[12px] text-[#1a1a1a]">
                                          {typeof value === "object"
                                            ? JSON.stringify(value, null, 2)
                                            : String(value)}
                                        </p>
                                      </div>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <div className="rounded-md border border-[#e6eaf0] bg-white px-2.5 py-2 text-[12px] italic text-[#9aa3af]">
                                  No tasks
                                </div>
                              )}
                            </div>

                            <div>
                              <p className={cn(org.label, "mb-1")}>Files</p>
                              {item.record.fileids?.files &&
                              item.record.fileids.files.length > 0 ? (
                                <div className="space-y-2">
                                  {item.record.fileids.files.filter((f) =>
                                    f.filetype?.startsWith("image/"),
                                  ).length > 0 ? (
                                    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5">
                                      {item.record.fileids.files
                                        .filter((file) => file.filetype?.startsWith("image/"))
                                        .map((file) => (
                                          <button
                                            key={file.id}
                                            type="button"
                                            className="relative aspect-square overflow-hidden rounded-md border border-[#e6eaf0] bg-[#f8fafc]"
                                            onClick={() => handleViewImage(file)}
                                          >
                                            {imageUrls[file.id] ? (
                                              <img
                                                src={imageUrls[file.id]}
                                                alt={file.filename}
                                                className="h-full w-full object-cover"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.src = filesService.getImageUrl(file.id);
                                                }}
                                              />
                                            ) : loadingImages.has(file.id) ? (
                                              <div className="flex h-full w-full items-center justify-center">
                                                <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
                                              </div>
                                            ) : (
                                              <img
                                                src={filesService.getImageUrl(file.id)}
                                                alt={file.filename}
                                                className="h-full w-full object-cover"
                                              />
                                            )}
                                            <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity hover:bg-black/35 hover:opacity-100">
                                              <Eye className="h-3.5 w-3.5 text-white" />
                                            </span>
                                          </button>
                                        ))}
                                    </div>
                                  ) : null}

                                  {item.record.fileids.files.filter(
                                    (f) => !f.filetype?.startsWith("image/"),
                                  ).length > 0 ? (
                                    <div className="space-y-1">
                                      {item.record.fileids.files
                                        .filter((file) => !file.filetype?.startsWith("image/"))
                                        .map((file) => (
                                          <div
                                            key={file.id}
                                            className="flex items-center gap-2 rounded-md border border-[#e6eaf0] bg-white px-2.5 py-1.5"
                                          >
                                            <File className="h-3.5 w-3.5 shrink-0 text-[#9aa3af]" />
                                            <div className="min-w-0">
                                              <p className="truncate text-[12px] font-medium text-[#1a1a1a]">
                                                {file.filename}
                                              </p>
                                              <p className="text-[11px] text-[#9aa3af]">
                                                {file.filetype} · {(file.filesize / 1024).toFixed(1)} KB
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                <div className="rounded-md border border-[#e6eaf0] bg-white px-2.5 py-2 text-[12px] italic text-[#9aa3af]">
                                  No files
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedImage?.filename}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {selectedImage && (
              <img
                src={selectedImage.url}
                alt={selectedImage.filename}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = filesService.getImageUrl(selectedImage.id);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / edit record — side panel on desktop, bottom drawer on mobile */}
      <ResponsiveEditSheet
        open={isAddRecordOpen}
        onOpenChange={setIsAddRecordOpen}
        title={editingRecord ? `Edit Appointment Record #${editingRecord.id}` : "Add Appointment Record"}
        subtitle={
          editingRecord
            ? "Update the existing appointment record."
            : "Add a new appointment record for historical data or records from before using the software."
        }
        isEdit={Boolean(editingRecord)}
        saving={isSaving}
        onCancel={handleCloseAddRecord}
        onSave={() => void handleSaveRecord()}
        saveLabel={editingRecord ? "Update Record" : "Save Record"}
      >
        <div className="space-y-4">
            {/* Appointment Date */}
            <div>
              <Label htmlFor="appointment-date">Appointment Date *</Label>
              <Input
                id="appointment-date"
                type="date"
                max={format(new Date(), "yyyy-MM-dd")}
                value={selectedDate && !isNaN(selectedDate.getTime()) ? format(selectedDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) {
                    // Ensure selected date is not in the future
                    const today = new Date();
                    today.setHours(23, 59, 59, 999); // End of today
                    if (newDate <= today) {
                      setSelectedDate(newDate);
                    } else {
                      toast({
                        title: "Invalid Date",
                        description: "Appointment date cannot be in the future. Please select today or a past date.",
                        variant: "destructive",
                      });
                    }
                  }
                }}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only past and present dates are allowed
              </p>
            </div>

            {/* Report */}
            <div>
              <Label htmlFor="report">Report</Label>
              <Textarea
                id="report"
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Enter report details..."
                rows={4}
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter additional notes..."
                rows={4}
              />
            </div>

            {/* Tasks */}
            {isLoadingTasks ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading appointment fields…
              </div>
            ) : tasks.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label>Appointment values</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateValueOpen(true)}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add value
                  </Button>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">
                  Same fields as Profile → Appointment values
                </p>
                <div className="space-y-3 mt-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-3">
                      <Label className="text-sm font-medium mb-2 block">
                        {task.displaytext || task.identifier}
                      </Label>
                      {renderTaskInput(task)}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
                <p>No appointment fields yet.</p>
                <Button
                  type="button"
                  variant="link"
                  className="mt-1 h-auto p-0 text-[#2a5af5]"
                  onClick={() => setIsCreateValueOpen(true)}
                >
                  Create reference value
                </Button>
              </div>
            )}

            {/* File Upload */}
            <div>
              <Label>Files & Images</Label>
              <div className="mt-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outline"
                    disabled={isUploading}
                    asChild
                    type="button"
                  >
                    <span>
                      {isUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload Files
                    </span>
                  </Button>
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-4">
                  {uploadedFiles.filter((f) => f.filetype?.startsWith("image/")).length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Images</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {uploadedFiles
                          .filter((file) => file.filetype?.startsWith("image/"))
                          .map((file) => (
                            <div key={file.id} className="relative group border rounded-lg overflow-hidden bg-gray-100 aspect-square">
                              {imageUrls[file.id] ? (
                                <img
                                  src={imageUrls[file.id]}
                                  alt={file.filename}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                                onClick={() => handleRemoveFile(file.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {uploadedFiles.filter((f) => !f.filetype?.startsWith("image/")).length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Documents</Label>
                      <div className="space-y-2">
                        {uploadedFiles
                          .filter((file) => !file.filetype?.startsWith("image/"))
                          .map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center space-x-2">
                                <File className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{file.filename}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile(file.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>
      </ResponsiveEditSheet>

      <CreateAppointmentTaskValueDialog
        open={isCreateValueOpen}
        onOpenChange={setIsCreateValueOpen}
        organizationId={organizationId}
        existingTasks={tasks}
        onCreated={handleAppointmentValueCreated}
      />
    </>
  );
};

export default EnhancedTimeline;
