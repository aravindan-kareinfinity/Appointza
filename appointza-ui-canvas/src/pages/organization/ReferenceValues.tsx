import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { OrganizationPageShell } from "@/components/layout/OrganizationPageShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Save, Loader2, Database, ArrowLeft, ChevronUp, ChevronDown, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { ReferenceTypeService } from "@/services/referencetype.service";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { ReferenceType, ReferenceTypeSelectReq } from "@/models/referencetype.model";
import { EventService } from "@/services/event.service";
import { Event, EventSelectReq } from "@/models/event.model";
import {
  mergeReferenceValueAttributes,
  nextReferenceValueDisplayOrder,
  readReferenceValueDisplayOrder,
  sortReferenceValuesByDisplayOrder,
} from "@/utils/referencevalue.util";
import {
  type EventBookingFormField,
  parseEventBookingFormFieldsFromNotes,
  serializeEventBookingFormFields,
} from "@/utils/eventBookingFormFields.util";
import SettingsEmbeddedHeader from "@/components/layout/SettingsEmbeddedHeader";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import { EventFormFieldsEditor } from "@/components/organization/EventFormFieldsEditor";
import CreateAppointmentTaskValueDialog from "@/components/organization/CreateAppointmentTaskValueDialog";
import {
  CRM_REFERENCE_TYPE_IDENTIFIERS,
  ensureLeadReferenceTypes,
} from "@/utils/leadReferenceTypes.util";

/** Dialog shell tuned for small screens (near full-width, scroll body, sticky footer). */
const referenceValueDialogClassName = cn(
  "flex max-h-[min(92dvh,880px)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg",
);

const ReferenceValuesPage = ({ embedded = false }: { embedded?: boolean }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { id: globalLocationId } = useGlobalId();
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkAppliedRef = useRef(false);
  
  // State
  const [referenceTypes, setReferenceTypes] = useState<ReferenceType[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [selectedReferenceType, setSelectedReferenceType] = useState<number | null>(null);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isLoadingValues, setIsLoadingValues] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  
  // New reference value form
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newReferenceValue, setNewReferenceValue] = useState({
    identifier: "",
    displaytext: "",
    description: "",
    notes: "",
    datatype: "",
    referencetypeid: 0
  });
  /** Event booking form fields (create dialog); persisted as JSON in `notes`. */
  const [createEventFormFields, setCreateEventFormFields] = useState<EventBookingFormField[]>([]);
  const [editEventFormFields, setEditEventFormFields] = useState<EventBookingFormField[]>([]);
  /** Inline editor for event booking forms (simpler than dialog + values list). */
  const [inlineEventFormFields, setInlineEventFormFields] = useState<EventBookingFormField[]>([]);
  const [existingEventFormValue, setExistingEventFormValue] = useState<ReferenceValue | null>(null);

  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [valueToDelete, setValueToDelete] = useState<number | null>(null);

  // Edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<ReferenceValue | null>(null);
  const [editForm, setEditForm] = useState({
    identifier: "",
    displaytext: "",
    description: "",
    notes: "",
    datatype: "",
    displayOrder: "",
  });

  // Services
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const referenceTypeService = useMemo(() => new ReferenceTypeService(), []);
  const eventService = useMemo(() => new EventService(), []);

  // Load reference types — appointment + CRM lead lookups
  const loadReferenceTypes = async () => {
    setIsLoadingTypes(true);
    try {
      const req = new ReferenceTypeSelectReq();
      const allTypes = (await referenceTypeService.select(req)) || [];

      // Ensure EVENTBOOKINGFORM exists
      const hasEventForm = allTypes.some((t) => t.identifier === "EVENTBOOKINGFORM");
      if (!hasEventForm && user?.organisationid) {
        try {
          const created = new ReferenceType();
          created.identifier = "EVENTBOOKINGFORM";
          created.displaytext = "Event Booking Form";
          created.langcode = "en";
          created.organizationid = user.organisationid;
          created.isactive = true;
          await referenceTypeService.insert(created);
        } catch (e) {
          console.error("Error creating EVENTBOOKINGFORM reference type:", e);
        }
      }

      if (user?.organisationid) {
        try {
          await ensureLeadReferenceTypes(
            referenceTypeService,
            referenceValueService,
            user.organisationid,
          );
        } catch (e) {
          console.error("Error ensuring lead reference types:", e);
        }
      }

      const refreshed = (await referenceTypeService.select(req)) || [];
      const allowed = new Set([
        "APPOINTMENTTASK",
        "APPOINTMENTSTATUS",
        "EVENTBOOKINGFORM",
        ...CRM_REFERENCE_TYPE_IDENTIFIERS,
      ]);
      const filteredTypes = refreshed.filter((type) => allowed.has(type.identifier));

      setReferenceTypes(filteredTypes);
    } catch (error) {
      console.error('Error loading reference types:', error);
      toast({
        title: "Error",
        description: "Failed to load reference types. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTypes(false);
    }
  };

  // Load reference values for selected type
  const loadReferenceValues = async (referencetypeid: number) => {
    if (!referencetypeid || referencetypeid <= 0) return;
    
    setIsLoadingValues(true);
    try {
      const req = new ReferenceValueSelectReq();
      req.referencetypeid = referencetypeid;
      req.organisationid = user?.organisationid || 0;
      const values = await referenceValueService.select(req);
      setReferenceValues(sortReferenceValuesByDisplayOrder(values || []));
    } catch (error) {
      console.error('Error loading reference values:', error);
      toast({
        title: "Error",
        description: "Failed to load reference values. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingValues(false);
    }
  };

  const loadEvents = async () => {
    if (!user?.organisationid) return;
    try {
      const req = new EventSelectReq();
      req.organisation_id = user.organisationid;
      req.organisation_location_id = globalLocationId
        ? Number(globalLocationId)
        : user.locationid || 0;
      req.include_past = true;
      const list = await eventService.select(req);
      setEvents(list || []);
    } catch (error) {
      console.error("Error loading events:", error);
      setEvents([]);
    }
  };

  const createReferenceValue = async (options?: { keepOpen?: boolean }) => {
    if (!user?.organisationid || !newReferenceValue.referencetypeid || newReferenceValue.referencetypeid <= 0) return;

    const selectedType = referenceTypes.find(type => type.id === newReferenceValue.referencetypeid);
    const isEventBookingForm = selectedType?.identifier === "EVENTBOOKINGFORM";

    if (isEventBookingForm) {
      if (!selectedEventId) {
        toast({
          title: "Select an event",
          description: "Choose which event this booking form applies to.",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate DateTime datatype
    if (selectedType?.identifier === 'APPOINTMENTTASK' && newReferenceValue.datatype === 'datetime') {
      // Validate that displaytext is a valid datetime
      const dateTimeRegex = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/;
      const dateTimeTest = new Date(newReferenceValue.displaytext);
      if (!dateTimeRegex.test(newReferenceValue.displaytext) || isNaN(dateTimeTest.getTime())) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid DateTime value (e.g., 2024-01-15T10:30:00 or 2024-01-15 10:30:00)",
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsSaving(true);
    try {
      const referenceValue = new ReferenceValue();
      if (isEventBookingForm) {
        const evt = events.find(e => e.id === selectedEventId);
        referenceValue.identifier = `EVENT_${selectedEventId}`;
        referenceValue.displaytext = evt?.event_name || `Event ${selectedEventId}`;
      } else {
        referenceValue.identifier = newReferenceValue.identifier;
        referenceValue.displaytext = newReferenceValue.displaytext;
      }
      referenceValue.description = newReferenceValue.description;
      
      // For APPOINTMENTTASK, include datatype in notes. For EVENTBOOKINGFORM, store { fields } JSON.
      if (selectedType?.identifier === 'EVENTBOOKINGFORM') {
        referenceValue.notes =
          createEventFormFields.length > 0 ? serializeEventBookingFormFields(createEventFormFields) : "";
      } else if (selectedType?.identifier === 'APPOINTMENTTASK' && newReferenceValue.datatype) {
        referenceValue.notes = `Data Type: ${newReferenceValue.datatype}${newReferenceValue.notes ? `\n\nNotes: ${newReferenceValue.notes}` : ''}`;
      } else {
        referenceValue.notes = newReferenceValue.notes;
      }
      
      referenceValue.referencetypeid = newReferenceValue.referencetypeid;
      referenceValue.organizationid = user.organisationid;
      referenceValue.isactive = true;
      const nextOrder = nextReferenceValueDisplayOrder(referenceValues);
      referenceValue.attributes = mergeReferenceValueAttributes(referenceValue, {
        DisplayOrder: nextOrder,
      });
      
      await referenceValueService.insert(referenceValue);
      
      const keepOpen = options?.keepOpen === true;
      // Reset form (keep referencetypeid and keep dialog open if requested)
      setNewReferenceValue(prev => ({
        identifier: "",
        displaytext: "",
        description: "",
        notes: "",
        datatype: "",
        referencetypeid: keepOpen ? prev.referencetypeid : 0
      }));
      if (keepOpen && isEventBookingForm) {
        setCreateEventFormFields([]);
      }
      if (!keepOpen) {
        setIsCreateDialogOpen(false);
        setCreateEventFormFields([]);
      }
      
      // Reload values
      await loadReferenceValues(newReferenceValue.referencetypeid);
      
      toast({
        title: "Reference Value Created",
        description: "New reference value has been created successfully.",
      });
    } catch (error) {
      console.error('Error creating reference value:', error);
      toast({
        title: "Error",
        description: "Failed to create reference value. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Create new reference value
  const handleCreateReferenceValue = async () => {
    await createReferenceValue({ keepOpen: false });
  };

  const handleCreateAndAddAnother = async () => {
    await createReferenceValue({ keepOpen: true });
  };

  // Show edit dialog
  const handleEditClick = (value: ReferenceValue) => {
    setEditingValue(value);

    const refType = referenceTypes.find((t) => t.id === value.referencetypeid);
    if (refType?.identifier === "EVENTBOOKINGFORM") {
      setEditEventFormFields(parseEventBookingFormFieldsFromNotes(value.notes || ""));
    } else {
      setEditEventFormFields([]);
    }

    // Extract datatype from notes if it exists
    let datatype = "";
    let notes = value.notes || "";

    if (refType?.identifier === "EVENTBOOKINGFORM") {
      notes = "";
    } else if (value.notes && value.notes.includes("Data Type:")) {
      const lines = value.notes.split('\n');
      const dataTypeLine = lines.find(line => line.startsWith('Data Type:'));
      if (dataTypeLine) {
        datatype = dataTypeLine.replace('Data Type:', '').trim();
        // Remove the datatype line from notes
        notes = lines.filter(line => !line.startsWith('Data Type:')).join('\n').replace(/^Notes:\s*/, '').trim();
      }
    }
    
    const attrs = value.attributes as Record<string, unknown> | undefined;
    const rawOrder = attrs?.DisplayOrder ?? attrs?.displayOrder;
    const displayOrderStr =
      typeof rawOrder === "number" && Number.isFinite(rawOrder)
        ? String(rawOrder)
        : typeof rawOrder === "string" && rawOrder.trim() !== ""
          ? rawOrder.trim()
          : "";

    setEditForm({
      identifier: value.identifier || "",
      displaytext: value.displaytext || "",
      description: value.description || "",
      notes: notes,
      datatype: datatype,
      displayOrder: displayOrderStr,
    });
    setIsEditDialogOpen(true);
  };

  // Show delete confirmation dialog
  const handleDeleteClick = (valueId: number) => {
    setValueToDelete(valueId);
    setIsDeleteDialogOpen(true);
  };

  // Update reference value
  const handleUpdateReferenceValue = async () => {
    if (!editingValue || !user?.organisationid) return;

    const selectedType = referenceTypes.find(type => type.id === editingValue.referencetypeid);

    // Validate DateTime datatype
    if (selectedType?.identifier === 'APPOINTMENTTASK' && editForm.datatype === 'datetime') {
      // Validate that displaytext is a valid datetime
      const dateTimeRegex = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/;
      const dateTimeTest = new Date(editForm.displaytext);
      if (!dateTimeRegex.test(editForm.displaytext) || isNaN(dateTimeTest.getTime())) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid DateTime value (e.g., 2024-01-15T10:30:00 or 2024-01-15 10:30:00)",
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsSaving(true);
    try {
      // Prepare the updated reference value
      const updatedValue = { ...editingValue };
      updatedValue.identifier = editForm.identifier;
      updatedValue.displaytext = editForm.displaytext;
      updatedValue.description = editForm.description;
      
      // For APPOINTMENTTASK, include datatype in notes. For EVENTBOOKINGFORM store { fields } JSON.
      if (selectedType?.identifier === 'EVENTBOOKINGFORM') {
        updatedValue.notes =
          editEventFormFields.length > 0 ? serializeEventBookingFormFields(editEventFormFields) : "";
      } else if (selectedType?.identifier === 'APPOINTMENTTASK' && editForm.datatype) {
        updatedValue.notes = `Data Type: ${editForm.datatype}${editForm.notes ? `\n\nNotes: ${editForm.notes}` : ''}`;
      } else {
        updatedValue.notes = editForm.notes;
      }

      const nextAttrs = mergeReferenceValueAttributes(updatedValue, {});
      if (editForm.displayOrder.trim() === "") {
        delete (nextAttrs as Record<string, unknown>).DisplayOrder;
        delete (nextAttrs as Record<string, unknown>).displayOrder;
      } else {
        const ord = parseInt(editForm.displayOrder.trim(), 10);
        if (!Number.isNaN(ord)) {
          (nextAttrs as Record<string, unknown>).DisplayOrder = ord;
          delete (nextAttrs as Record<string, unknown>).displayOrder;
        }
      }
      updatedValue.attributes = nextAttrs;
      
      await referenceValueService.update(updatedValue);
      
      // Reset form and close dialog
      setEditingValue(null);
      setEditForm({
        identifier: "",
        displaytext: "",
        description: "",
        notes: "",
        datatype: "",
        displayOrder: "",
      });
      setEditEventFormFields([]);
      setIsEditDialogOpen(false);
      
      // Reload values
      if (selectedReferenceType) {
        await loadReferenceValues(selectedReferenceType);
      }
      
      toast({
        title: "Reference Value Updated",
        description: "Reference value has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating reference value:', error);
      toast({
        title: "Error",
        description: "Failed to update reference value. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete reference value
  const handleDeleteReferenceValue = async () => {
    if (!valueToDelete || valueToDelete <= 0) return;
    
    try {
      // Find the reference value to get its version
      const valueToDeleteObj = referenceValues.find(v => v.id === valueToDelete);
      if (!valueToDeleteObj) {
        toast({
          title: "Error",
          description: "Reference value not found.",
          variant: "destructive",
        });
        return;
      }

      // Create delete request with id and version
      const deleteReq = {
        id: valueToDeleteObj.id,
        version: valueToDeleteObj.version
      };

      await referenceValueService.delete(deleteReq);
      
      // Reload values
      if (selectedReferenceType) {
        await loadReferenceValues(selectedReferenceType);
      }
      
      // Close dialog and reset
      setIsDeleteDialogOpen(false);
      setValueToDelete(null);
      
      toast({
        title: "Reference Value Deleted",
        description: "Reference value has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting reference value:', error);
      toast({
        title: "Error",
        description: "Failed to delete reference value. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMoveReferenceValue = async (id: number, direction: "up" | "down") => {
    const sorted = sortReferenceValuesByDisplayOrder(referenceValues);
    const i = sorted.findIndex((v) => v.id === id);
    if (i < 0) return;
    const j = direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= sorted.length) return;
    const a = sorted[i];
    const b = sorted[j];
    if (a.organizationid === 0 || b.organizationid === 0) {
      toast({
        title: "Cannot reorder",
        description:
          "System reference values cannot be swapped. Use Display order in Edit to place your values before or after them.",
        variant: "destructive",
      });
      return;
    }
    const oa = readReferenceValueDisplayOrder(a) ?? 1_000_000 + i;
    const ob = readReferenceValueDisplayOrder(b) ?? 1_000_000 + j;
    setIsSaving(true);
    try {
      const updatedA = {
        ...a,
        attributes: mergeReferenceValueAttributes(a, { DisplayOrder: ob }),
      };
      const updatedB = {
        ...b,
        attributes: mergeReferenceValueAttributes(b, { DisplayOrder: oa }),
      };
      await referenceValueService.update(updatedA);
      await referenceValueService.update(updatedB);
      if (selectedReferenceType) await loadReferenceValues(selectedReferenceType);
      toast({
        title: "Order updated",
        description: "Display order has been saved.",
      });
    } catch (error) {
      console.error("Error reordering reference values:", error);
      toast({
        title: "Error",
        description: "Failed to update order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadReferenceTypes();
  }, []);

  const setupBookingForm = searchParams.get("setupBookingForm") === "1";
  const deepLinkEventId = useMemo(() => {
    const raw = searchParams.get("eventId");
    if (!raw) return null;
    const id = parseInt(raw, 10);
    return Number.isFinite(id) && id > 0 ? id : null;
  }, [searchParams]);

  const selectedType = referenceTypes.find((t) => t.id === selectedReferenceType);
  const isEventBookingForm = selectedType?.identifier === "EVENTBOOKINGFORM";

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  // Deep link after event creation: auto-select booking form type + event
  useEffect(() => {
    if (deepLinkAppliedRef.current || referenceTypes.length === 0 || !deepLinkEventId) return;

    const eventFormType = referenceTypes.find((t) => t.identifier === "EVENTBOOKINGFORM");
    if (!eventFormType) return;

    deepLinkAppliedRef.current = true;
    setSelectedReferenceType(eventFormType.id);
    setNewReferenceValue((prev) => ({ ...prev, referencetypeid: eventFormType.id }));
    setSelectedEventId(deepLinkEventId);
    loadReferenceValues(eventFormType.id);
    loadEvents();
  }, [referenceTypes, deepLinkEventId]);

  // Keep inline editor in sync with saved form for selected event
  useEffect(() => {
    if (!isEventBookingForm || !selectedEventId) {
      setExistingEventFormValue(null);
      setInlineEventFormFields([]);
      return;
    }

    const ident = `EVENT_${selectedEventId}`;
    const existing = referenceValues.find(
      (v) => (v.identifier || "").toUpperCase() === ident.toUpperCase(),
    );

    if (existing) {
      setExistingEventFormValue(existing);
      setInlineEventFormFields(parseEventBookingFormFieldsFromNotes(existing.notes || ""));
    } else {
      setExistingEventFormValue(null);
      setInlineEventFormFields([]);
    }
  }, [isEventBookingForm, selectedEventId, referenceValues]);

  const clearBookingFormSetupParams = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("eventId");
        next.delete("setupBookingForm");
        return next;
      },
      { replace: true },
    );
  };

  const handleSaveInlineEventBookingForm = async () => {
    if (!user?.organisationid || !selectedReferenceType || !selectedEventId) return;

    setIsSaving(true);
    try {
      const notes =
        inlineEventFormFields.length > 0
          ? serializeEventBookingFormFields(inlineEventFormFields)
          : "";
      const displayName = selectedEvent?.event_name || `Event ${selectedEventId}`;

      if (existingEventFormValue) {
        const updated = { ...existingEventFormValue };
        updated.notes = notes;
        updated.displaytext = displayName;
        await referenceValueService.update(updated);
      } else {
        const referenceValue = new ReferenceValue();
        referenceValue.identifier = `EVENT_${selectedEventId}`;
        referenceValue.displaytext = displayName;
        referenceValue.referencetypeid = selectedReferenceType;
        referenceValue.organizationid = user.organisationid;
        referenceValue.notes = notes;
        referenceValue.isactive = true;
        referenceValue.attributes = mergeReferenceValueAttributes(referenceValue, {
          DisplayOrder: nextReferenceValueDisplayOrder(referenceValues),
        });
        await referenceValueService.insert(referenceValue);
      }

      await loadReferenceValues(selectedReferenceType);
      clearBookingFormSetupParams();

      toast({
        title: existingEventFormValue ? "Booking form updated" : "Booking form saved",
        description: `Guests booking “${displayName}” will see these questions.`,
      });
    } catch (error) {
      console.error("Error saving event booking form:", error);
      toast({
        title: "Error",
        description: "Failed to save booking form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredReferenceValues = useMemo(() => {
    if (!isEventBookingForm) return referenceValues;
    if (!selectedEventId) return referenceValues;
    const ident = `EVENT_${selectedEventId}`;
    return referenceValues.filter((v) => (v.identifier || "").toUpperCase() === ident.toUpperCase());
  }, [isEventBookingForm, referenceValues, selectedEventId]);

  const displayReferenceValues = useMemo(
    () => sortReferenceValuesByDisplayOrder(filteredReferenceValues),
    [filteredReferenceValues],
  );

  useEffect(() => {
    if (isEventBookingForm) {
      loadEvents();
    }
  }, [isEventBookingForm, globalLocationId]);

  return (
    <OrganizationPageShell embedded={embedded}>
      {embedded ? (
        <SettingsEmbeddedHeader
          icon={Database}
          title="Reference Values"
          description={
            setupBookingForm && selectedEvent
              ? `Set up booking questions for “${selectedEvent.event_name}”.`
              : "Manage appointment tasks/statuses, event booking questions, and CRM lead type, source, and category."
          }
        />
      ) : null}
      <div
        className={
          embedded
            ? settingsEmbedded.sectionBody
            : "mx-auto w-full max-w-6xl space-y-5 px-3 pb-10 sm:space-y-6 sm:px-6 lg:px-8"
        }
      >
        {!embedded ? (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="h-10 w-10 shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="space-y-1 px-4 pt-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Configuration</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {isEventBookingForm
                ? "Pick an event, add booking questions, and save — guests see them on the public booking page."
                : "Pick a type, then add or edit values. On phones, forms scroll inside the dialog so nothing is cut off."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-4 pb-6 sm:px-6 lg:px-8">
            {/* Reference Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="reference-type">Reference type</Label>
              <Select
                value={selectedReferenceType?.toString() || ""}
                onValueChange={(value) => {
                  const typeId = parseInt(value);
                  setSelectedReferenceType(typeId);
                  setNewReferenceValue(prev => ({ ...prev, referencetypeid: typeId }));
                  loadReferenceValues(typeId);
                }}
              >
                <SelectTrigger id="reference-type" className="h-11 w-full touch-manipulation sm:h-10">
                  <SelectValue placeholder="Select a reference type" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingTypes ? (
                    <SelectItem value="loading" disabled>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading types...
                    </SelectItem>
                  ) : (
                    referenceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.identifier} - {type.displaytext}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Reference Values List */}
            {selectedReferenceType && selectedReferenceType > 0 && (
              <div className="space-y-4">
                {isEventBookingForm ? (
                  <>
                    {setupBookingForm && selectedEvent && (
                      <div className="rounded-xl border border-[#FFD4CC] bg-[#FFF8F5] px-4 py-3">
                        <p className="text-sm font-semibold text-[#E85D4C]">Step 2 of 2 — Booking form</p>
                        <p className="mt-1 text-sm text-stone-600">
                          Your event “{selectedEvent.event_name}” was created. Add the questions guests answer when
                          booking online.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="event-select" className="text-base font-semibold">
                        1. Choose event
                      </Label>
                      <Select
                        value={selectedEventId?.toString() || ""}
                        onValueChange={(value) => {
                          setSelectedEventId(parseInt(value, 10));
                          clearBookingFormSetupParams();
                        }}
                      >
                        <SelectTrigger id="event-select" className="h-11 w-full touch-manipulation sm:h-10">
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                        <SelectContent>
                          {events.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No events yet — create one under Services first
                            </SelectItem>
                          ) : (
                            events.map((e) => (
                              <SelectItem key={e.id} value={e.id.toString()}>
                                {e.event_name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedEventId ? (
                      <div className="space-y-4 rounded-xl border border-stone-200 bg-stone-50/50 p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#E85D4C]">
                            <CalendarCheck className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-base font-semibold text-stone-900 sm:text-lg">
                              2. Booking questions for {selectedEvent?.event_name || "this event"}
                            </h4>
                            <p className="mt-1 text-sm leading-relaxed text-stone-500">
                              These appear on the public booking page for this event only (e.g. guest name, age,
                              preferences).
                            </p>
                          </div>
                        </div>

                        {isLoadingValues ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            <span>Loading booking form…</span>
                          </div>
                        ) : (
                          <>
                            <EventFormFieldsEditor
                              idPrefix="inline"
                              fields={inlineEventFormFields}
                              onChange={setInlineEventFormFields}
                            />
                            <div className="flex flex-col gap-2 border-t border-stone-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-xs text-stone-500">
                                {existingEventFormValue
                                  ? `${inlineEventFormFields.length} field${inlineEventFormFields.length === 1 ? "" : "s"} saved`
                                  : inlineEventFormFields.length > 0
                                    ? "Save to publish on the booking page"
                                    : "Add at least one question, then save"}
                              </p>
                              <Button
                                type="button"
                                className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto"
                                onClick={handleSaveInlineEventBookingForm}
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="mr-2 h-4 w-4" />
                                )}
                                {existingEventFormValue ? "Update booking form" : "Save booking form"}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Pick an event above to set up or edit its booking form.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h4 className="text-base font-semibold">Values</h4>
                  {selectedType?.identifier === "APPOINTMENTTASK" ? (
                    <CreateAppointmentTaskValueDialog
                      open={isCreateDialogOpen}
                      onOpenChange={setIsCreateDialogOpen}
                      organizationId={user?.organisationid || 0}
                      existingTasks={referenceValues}
                      onCreated={() => {
                        if (selectedReferenceType) {
                          void loadReferenceValues(selectedReferenceType);
                        }
                      }}
                      trigger={
                        <DialogTrigger asChild>
                          <Button className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Add new
                          </Button>
                        </DialogTrigger>
                      }
                    />
                  ) : (
                  <Dialog
                    open={isCreateDialogOpen}
                    onOpenChange={(open) => {
                      setIsCreateDialogOpen(open);
                      if (!open) setCreateEventFormFields([]);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Add new
                      </Button>
                    </DialogTrigger>
                    <DialogContent className={referenceValueDialogClassName}>
                      <DialogHeader className="shrink-0 space-y-1 border-b bg-muted/25 px-4 py-3 text-left sm:px-6 sm:py-4">
                        <DialogTitle className="text-lg sm:text-xl">Create reference value</DialogTitle>
                        <DialogDescription className="text-sm leading-relaxed">
                          Add a new value for the selected type.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
                            <div className="space-y-2">
                              <Label htmlFor="identifier">Identifier</Label>
                              <Input
                                id="identifier"
                                value={newReferenceValue.identifier}
                                onChange={(e) => setNewReferenceValue(prev => ({
                                  ...prev,
                                  identifier: e.target.value
                                }))}
                                placeholder="Enter identifier (e.g., TASK_001)"
                                className="h-11 sm:h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="displaytext">Display Text</Label>
                              <Input
                                id="displaytext"
                                value={newReferenceValue.displaytext}
                                onChange={(e) => setNewReferenceValue(prev => ({
                                  ...prev,
                                  displaytext: e.target.value
                                }))}
                                placeholder="Enter display text"
                                className="h-11 sm:h-10"
                              />
                            </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newReferenceValue.description}
                            onChange={(e) => setNewReferenceValue(prev => ({
                              ...prev,
                              description: e.target.value
                            }))}
                            placeholder="Enter description (optional)"
                            rows={3}
                          />
                        </div>
                          <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                              id="notes"
                              value={newReferenceValue.notes}
                              onChange={(e) =>
                                setNewReferenceValue((prev) => ({
                                  ...prev,
                                  notes: e.target.value,
                                }))
                              }
                              placeholder="Enter notes (optional)"
                              rows={3}
                            />
                          </div>
                      </div>
                      <DialogFooter className="shrink-0 gap-2 border-t bg-background px-4 py-3 sm:px-6">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full touch-manipulation sm:h-10 sm:min-w-[7rem]"
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full touch-manipulation sm:h-10 sm:min-w-[10rem]"
                          onClick={handleCreateAndAddAnother}
                          disabled={
                            isSaving ||
                            !newReferenceValue.identifier ||
                            !newReferenceValue.displaytext
                          }
                        >
                          {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="mr-2 h-4 w-4" />
                          )}
                          Create & add another
                        </Button>
                        <Button
                          type="button"
                          className="h-11 w-full touch-manipulation sm:h-10 sm:min-w-[7rem]"
                          onClick={handleCreateReferenceValue}
                          disabled={
                            isSaving ||
                            !newReferenceValue.identifier ||
                            !newReferenceValue.displaytext
                          }
                        >
                          {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Create
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  )}
                </div>

                {/* Values List */}
                {isLoadingValues ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading reference values...</span>
                  </div>
                ) : displayReferenceValues.length > 0 ? (
                  <div className="space-y-2">
                    {displayReferenceValues.map((value) => {
                      const idx = displayReferenceValues.findIndex((v) => v.id === value.id);
                      const prevRv = idx > 0 ? displayReferenceValues[idx - 1] : null;
                      const nextRv =
                        idx >= 0 && idx < displayReferenceValues.length - 1
                          ? displayReferenceValues[idx + 1]
                          : null;
                      const canMoveUp =
                        value.organizationid !== 0 && !!prevRv && prevRv.organizationid !== 0;
                      const canMoveDown =
                        value.organizationid !== 0 && !!nextRv && nextRv.organizationid !== 0;
                      return (
                      <div
                        key={value.id}
                        className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm ring-1 ring-border/60 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium leading-snug">{value.displaytext}</span>
                            <Badge variant="secondary" className="max-w-full truncate text-xs font-normal">
                              {value.identifier}
                            </Badge>
                            {readReferenceValueDisplayOrder(value) != null && (
                              <Badge variant="outline" className="text-xs font-normal">
                                List order {readReferenceValueDisplayOrder(value)}
                              </Badge>
                            )}
                          </div>
                          {value.description && (
                            <div className="text-sm text-muted-foreground">
                              {value.description}
                            </div>
                          )}
                          {value.notes &&
                            (value.identifier?.startsWith("EVENT_") ? (
                              <div className="text-sm text-muted-foreground">
                                {(() => {
                                  const n = parseEventBookingFormFieldsFromNotes(value.notes).length;
                                  return `${n} booking field${n === 1 ? "" : "s"}`;
                                })()}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                {value.notes.split("\n").map((line, index) => (
                                  <div key={index}>
                                    {line.startsWith("Data Type:") ? (
                                      <span className="font-medium text-blue-600">{line}</span>
                                    ) : line.startsWith("Notes:") ? (
                                      <span className="font-medium text-gray-600">{line}</span>
                                    ) : (
                                      line
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))}
                        </div>
                        <div className="flex shrink-0 flex-row items-center justify-end gap-1 border-t pt-2 sm:border-0 sm:pt-0">
                          {value.organizationid !== 0 && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 touch-manipulation sm:h-9 sm:w-9"
                                disabled={!canMoveUp || isSaving}
                                title="Move up"
                                onClick={() => handleMoveReferenceValue(value.id, "up")}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 touch-manipulation sm:h-9 sm:w-9"
                                disabled={!canMoveDown || isSaving}
                                title="Move down"
                                onClick={() => handleMoveReferenceValue(value.id, "down")}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {value.organizationid !== 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 touch-manipulation sm:h-9 sm:w-9"
                              onClick={() => handleEditClick(value)}
                              aria-label="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {value.organizationid !== 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 touch-manipulation sm:h-9 sm:w-9"
                              onClick={() => handleDeleteClick(value.id)}
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Database className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">No reference values found</h3>
                    <p className="text-muted-foreground mt-2">
                      No reference values found for this type.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click “Add new” to create the first reference value.
                    </p>
                  </div>
                )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setEditingValue(null);
              setEditEventFormFields([]);
              setEditForm({
                identifier: "",
                displaytext: "",
                description: "",
                notes: "",
                datatype: "",
                displayOrder: "",
              });
            }
          }}
        >
          <DialogContent className={referenceValueDialogClassName}>
            <DialogHeader className="shrink-0 space-y-1 border-b bg-muted/25 px-4 py-3 text-left sm:px-6 sm:py-4">
              <DialogTitle className="text-lg sm:text-xl">Edit reference value</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Update the value. Event booking rows keep a fixed event id in the identifier.
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
              <div className="space-y-2">
                <Label htmlFor="edit-identifier">Identifier</Label>
                <Input
                  id="edit-identifier"
                  value={editForm.identifier}
                  readOnly={
                    referenceTypes.find((t) => t.id === editingValue?.referencetypeid)?.identifier ===
                    "EVENTBOOKINGFORM"
                  }
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      identifier: e.target.value,
                    }))
                  }
                  placeholder="Enter identifier (e.g., TASK_001)"
                  className={cn(
                    "h-11 font-mono text-sm sm:h-10",
                    referenceTypes.find((t) => t.id === editingValue?.referencetypeid)?.identifier ===
                      "EVENTBOOKINGFORM" && "cursor-not-allowed bg-muted",
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-displaytext">Display text</Label>
                <Input
                  id="edit-displaytext"
                  value={editForm.displaytext}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      displaytext: e.target.value,
                    }))
                  }
                  placeholder="Enter display text"
                  className="h-11 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter description (optional)"
                  rows={3}
                  className="min-h-[5rem] resize-y"
                />
              </div>
              {referenceTypes.find((t) => t.id === editingValue?.referencetypeid)?.identifier !==
              "EVENTBOOKINGFORM" ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-display-order">List display order</Label>
                  <Input
                    id="edit-display-order"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={editForm.displayOrder}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        displayOrder: e.target.value,
                      }))
                    }
                    placeholder="1 = first (leave empty to clear)"
                    className="h-11 sm:h-10"
                  />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Lower numbers appear first in admin lists. New values get the next number automatically.
                  </p>
                </div>
              ) : null}
              
              {/* Data Type field - only show for APPOINTMENTTASK */}
              {(() => {
                const selectedType = referenceTypes.find(type => type.id === editingValue?.referencetypeid);
                return selectedType?.identifier === 'APPOINTMENTTASK' ? (
                  <div className="space-y-2">
                    <Label htmlFor="edit-datatype">Data Type</Label>
                    <Select
                      value={editForm.datatype}
                      onValueChange={(value) => setEditForm(prev => ({
                        ...prev,
                        datatype: value
                      }))}
                    >
                      <SelectTrigger id="edit-datatype" className="h-11 w-full touch-manipulation sm:h-10">
                        <SelectValue placeholder="Select data type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="datetime">DateTime</SelectItem>
                        <SelectItem value="time">Time</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="integer">Integer</SelectItem>
                        <SelectItem value="decimal">Decimal</SelectItem>
                        <SelectItem value="float">Float</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null;
              })()}
              
              {referenceTypes.find((t) => t.id === editingValue?.referencetypeid)?.identifier ===
              "EVENTBOOKINGFORM" ? (
                <EventFormFieldsEditor
                  idPrefix="edit"
                  fields={editEventFormFields}
                  onChange={setEditEventFormFields}
                />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Enter notes (optional)"
                    rows={3}
                    className="min-h-[5rem] resize-y"
                  />
                </div>
              )}
            </div>
            <DialogFooter className="shrink-0 gap-2 border-t bg-background px-4 py-3 sm:px-6">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full touch-manipulation sm:h-10 sm:min-w-[7rem]"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingValue(null);
                  setEditForm({
                    identifier: "",
                    displaytext: "",
                    description: "",
                    notes: "",
                    datatype: "",
                    displayOrder: "",
                  });
                  setEditEventFormFields([]);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-11 w-full touch-manipulation sm:h-10 sm:min-w-[7rem]"
                onClick={handleUpdateReferenceValue}
                disabled={
                  isSaving ||
                  !editForm.identifier ||
                  !editForm.displaytext ||
                  (referenceTypes.find((type) => type.id === editingValue?.referencetypeid)?.identifier ===
                    "APPOINTMENTTASK" && !editForm.datatype)
                }
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Reference Value</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this reference value? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setValueToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteReferenceValue}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OrganizationPageShell>
  );
};

export default ReferenceValuesPage;
