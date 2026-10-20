import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users as UsersIcon, Phone, Search, ArrowLeft, UserPlus, Shield, CheckCircle, AlertCircle, Loader2, Edit, Trash2 } from "lucide-react";
import { OrganizationPageShell } from "@/components/layout/OrganizationPageShell";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UsersService } from "@/services/users.service";
import { StaffService } from "@/services/staff.service";
import { useStaff } from "@/hooks/useStaff";
import { useOrganisationLocations } from "@/hooks/useOrganisationLocations";
import { useMountWhenOpened } from "@/hooks/useMountWhenOpened";
import { UsersSelectReq, UsersLoginReq, Users, UsersPermissionData, UsersPermissionGroupData } from "@/models/users.model";
import { Staff, StaffSelectReq, StaffUser } from "@/models/staff.model";
import SettingsEmbeddedHeader from "@/components/layout/SettingsEmbeddedHeader";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

const StaffManagement = ({ embedded = false }: { embedded?: boolean }) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const organizationId = user?.organisationid || 0;

  // API services
  const usersService = useMemo(() => new UsersService(), []);
  const staffService = useMemo(() => new StaffService(), []);

  const {
    staff: staffList,
    isLoading: isLoadingStaff,
    refetch: refetchStaff,
  } = useStaff(isAuthenticated ? organizationId : undefined);

  const { data: locationsData } = useOrganisationLocations({
    organisationId: organizationId,
    staffLocationId: user?.locationid || 0,
    enabled: isAuthenticated && !!organizationId,
  });
  const locations = locationsData ?? [];

  // State for staff list
  const [staffToDelete, setStaffToDelete] = useState<{ id: number; name: string; userid: number } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // State for add staff form
  const [searchMobile, setSearchMobile] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Privileges state - mapped to backend permission structure
  const [privileges, setPrivileges] = useState({
    // New editandview privileges (single boolean for each)
    editandviewDashboard: false,
    editandviewAppointments: false,
    editandviewEvents: false,
    editandviewCreateService: false,
    editandviewCreateEvent: false,
    editandviewClients: false,
    editandviewBusinessHours: false,
    editandviewStaffManagement: false,
    editandviewLocationManagement: false,
    editandviewTemplates: false,
    editandviewPaymentSettings: false,
    editandviewBusinessvalues: false,
  });

  // State for editing staff
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const mountEditStaffDialog = useMountWhenOpened(showEditDialog);

  // State for active tab
  const [activeTab, setActiveTab] = useState<string>("list");

  // Sync default location when locations load
  useEffect(() => {
    if (locations.length > 0 && selectedLocationId === 0) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  // Search user by mobile number
  const searchUserByMobile = async () => {
    if (!searchMobile.trim()) {
      toast({
        title: "Enter Mobile Number",
        description: "Please enter a mobile number to search",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Searching user by mobile:', searchMobile);
      const req = new UsersSelectReq();
      req.mobile = searchMobile;
      
      const response = await usersService.select(req);
      console.log('✅ User search API response:', response);
      
      if (response && response.length > 0) {
        const user = response[0];
        setFoundUser(user);
        toast({
          title: "User Found",
          description: `Found user: ${user.name}`,
        });
      } else {
        setFoundUser(null);
        toast({
          title: "User Not Found",
          description: `No user found with mobile number: ${searchMobile}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error searching user:', error);
      toast({
        title: "Error",
        description: "Failed to search user",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle privilege change
  const handlePrivilegeChange = (privilege: string, checked: boolean) => {
    setPrivileges(prev => ({
      ...prev,
      [privilege]: checked
    }));
  };

  // Map frontend privileges to backend UsersPermissionData structure
  const mapPrivilegesToBackend = (): UsersPermissionData => {
    const permissionData = new UsersPermissionData();
    
    // New editandview privileges (single boolean for each)
    permissionData.editandviewDashboard = privileges.editandviewDashboard;
    permissionData.editandviewAppointments = privileges.editandviewAppointments;
    permissionData.editandviewEvents = privileges.editandviewEvents;
    permissionData.editandviewCreateService = privileges.editandviewCreateService;
    permissionData.editandviewCreateEvent = privileges.editandviewCreateEvent;
    permissionData.editandviewClients = privileges.editandviewClients;
    permissionData.editandviewBusinessHours = privileges.editandviewBusinessHours;
    permissionData.editandviewStaffManagement = privileges.editandviewStaffManagement;
    permissionData.editandviewLocationManagement = privileges.editandviewLocationManagement;
    permissionData.editandviewTemplates = privileges.editandviewTemplates;
    permissionData.editandviewPaymentSettings = privileges.editandviewPaymentSettings;
    permissionData.editandviewBusinessvalues = privileges.editandviewBusinessvalues;
    
    return permissionData;
  };

  // Map backend permissions to frontend state
  const mapBackendToPrivileges = (permissionData: UsersPermissionData | null | undefined) => {
    if (!permissionData) {
      return {
        editandviewDashboard: false,
        editandviewAppointments: false,
        editandviewEvents: false,
        editandviewCreateService: false,
        editandviewCreateEvent: false,
        editandviewClients: false,
        editandviewBusinessHours: false,
        editandviewStaffManagement: false,
        editandviewLocationManagement: false,
        editandviewTemplates: false,
        editandviewPaymentSettings: false,
        editandviewBusinessvalues: false,
      };
    }

    return {
      editandviewDashboard: permissionData.editandviewDashboard || false,
      editandviewAppointments: permissionData.editandviewAppointments || false,
      editandviewEvents: permissionData.editandviewEvents || false,
      editandviewCreateService: permissionData.editandviewCreateService || false,
      editandviewCreateEvent: permissionData.editandviewCreateEvent || false,
      editandviewClients: permissionData.editandviewClients || false,
      editandviewBusinessHours: permissionData.editandviewBusinessHours || false,
      editandviewStaffManagement: permissionData.editandviewStaffManagement || false,
      editandviewLocationManagement: permissionData.editandviewLocationManagement || false,
      editandviewTemplates: permissionData.editandviewTemplates || false,
      editandviewPaymentSettings: permissionData.editandviewPaymentSettings || false,
      editandviewBusinessvalues: permissionData.editandviewBusinessvalues || false,
    };
  };

  // Open edit dialog for staff member
  const handleEditStaff = (staff: StaffUser) => {
    setEditingStaff(staff);
    // Load existing privileges from staff.roles
    const existingPrivileges = mapBackendToPrivileges(staff.roles);
    setPrivileges(existingPrivileges);
    setSelectedLocationId(staff.organisationlocationid || 0);
    setShowEditDialog(true);
  };

  // Update staff member
  const handleUpdateStaff = async () => {
    if (!editingStaff) return;

    setIsAdding(true);
    try {
      console.log('✏️ Updating staff member:', editingStaff.name);
      
      // Get the staff record to update
      const staffSelectReq = new StaffSelectReq();
      staffSelectReq.id = editingStaff.id;
      staffSelectReq.organisationid = organizationId;
      
      const staffList = await staffService.select(staffSelectReq);
      if (!staffList || staffList.length === 0) {
        throw new Error('Staff member not found');
      }
      
      const staffToUpdate = staffList[0];
      
      // Update staff with new privileges
      staffToUpdate.roles = mapPrivilegesToBackend();
      staffToUpdate.organisationlocationid = selectedLocationId;
      staffToUpdate.modifiedby = organizationId;
      staffToUpdate.modifiedon = new Date();
      
      // Update user's permission attributes
      // First fetch the existing user to preserve all other fields
      try {
        const userSelectReq = new UsersSelectReq();
        userSelectReq.id = editingStaff.userid;
        const existingUsers = await usersService.select(userSelectReq);
        
        if (existingUsers && existingUsers.length > 0) {
          const existingUser = existingUsers[0];
          
          // Preserve all existing user data - ensure we don't lose any fields
          // Update only the permission attributes, preserve all other data
          if (!existingUser.attributes) {
            existingUser.attributes = new Users.AttributesData();
          }
          if (!existingUser.attributes.permission) {
            existingUser.attributes.permission = new UsersPermissionData();
          }
          
          // Only update the permission, keep everything else as-is
          existingUser.attributes.permission = mapPrivilegesToBackend();
          
          // Ensure version is set for optimistic locking
          if (!existingUser.version || existingUser.version === 0) {
            // If version is missing, we might need to fetch it, but let's try with what we have
            console.warn('⚠️ User version is missing, update might fail');
          }
          
          await usersService.update(existingUser);
          console.log('✅ Updated user permissions in Users table');
        } else {
          console.error('⚠️ User not found for ID:', editingStaff.userid);
        }
      } catch (error) {
        console.error('⚠️ Failed to update user permissions:', error);
        // Don't throw - continue with staff update even if user update fails
      }
      
      const response = await staffService.update(staffToUpdate);
      
      if (response) {
        toast({
          title: "Staff Updated Successfully",
          description: `${editingStaff.name}'s privileges have been updated.`,
        });
        
        setShowEditDialog(false);
        setEditingStaff(null);
        setPrivileges({
          editandviewDashboard: false,
          editandviewAppointments: false,
          editandviewEvents: false,
          editandviewCreateService: false,
          editandviewCreateEvent: false,
          editandviewClients: false,
          editandviewBusinessHours: false,
          editandviewStaffManagement: false,
          editandviewLocationManagement: false,
          editandviewTemplates: false,
          editandviewPaymentSettings: false,
          editandviewBusinessvalues: false,
        });
        
        await refetchStaff();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('❌ Error updating staff:', error);
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Add staff member
  const handleAddStaff = async () => {
    if (!foundUser || !selectedLocationId) {
      toast({
        title: "Missing Information",
        description: "Please search for a user and select a location",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      console.log('➕ Adding staff member:', foundUser.name);
      const req = new Staff();
      req.userid = foundUser.id;
      req.organisationid = organizationId;
      req.organisationlocationid = selectedLocationId;
      req.isactive = true;
      req.issuspended = false;
      req.isfactory = false;
      req.version = 1;
      req.createdby = organizationId;
      req.createdon = new Date();
      req.modifiedby = organizationId;
      req.modifiedon = new Date();
      
      // Map privileges to backend structure and set in Staff.roles
      const permissionData = mapPrivilegesToBackend();
      req.roles = permissionData;
      
      // Also update the user's attributes.permission in Users table
      const userUpdateReq = { ...foundUser };
      userUpdateReq.attributes = foundUser.attributes || new Users.AttributesData();
      if (!userUpdateReq.attributes.permission) {
        userUpdateReq.attributes.permission = new UsersPermissionData();
      }
      userUpdateReq.locationid = selectedLocationId;
      userUpdateReq.attributes.permission = permissionData;
      
      // Update user's permission attributes
      try {
        await usersService.update(userUpdateReq);
        console.log('✅ Updated user permissions in Users table');
      } catch (error) {
        console.error('⚠️ Failed to update user permissions:', error);
      }
      
      const response = await staffService.insert(req);
      
      if (response) {
        toast({
          title: "Staff Added Successfully",
          description: `${foundUser.name} has been added to your staff.`,
        });
        
        // Reset form
        setSearchMobile('');
        setFoundUser(null);
        setPrivileges({
          editandviewDashboard: false,
          editandviewAppointments: false,
          editandviewEvents: false,
          editandviewCreateService: false,
          editandviewCreateEvent: false,
          editandviewClients: false,
          editandviewBusinessHours: false,
          editandviewStaffManagement: false,
          editandviewLocationManagement: false,
          editandviewTemplates: false,
          editandviewPaymentSettings: false,
          editandviewBusinessvalues: false,
        });
        
        // Reload staff list
        await refetchStaff();
      } else {
        toast({
          title: "Error",
          description: "Failed to add staff member",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error adding staff:', error);
      toast({
        title: "Error",
        description: "Failed to add staff member",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
      setShowConfirmDialog(false);
    }
  };

  // Show delete confirmation dialog
  const handleRemoveStaff = (staffId: number, staffName: string, userId: number) => {
    setStaffToDelete({ id: staffId, name: staffName, userid: userId });
    setShowDeleteDialog(true);
  };

  // Confirm delete staff member
  const confirmDeleteStaff = async () => {
    if (!staffToDelete) return;

    try {
      console.log('🗑️ Removing staff member:', staffToDelete.name);
      
      // First, find the staff member to get their details
      const staffMember = staffList.find(staff => staff.id === staffToDelete.id);
      if (!staffMember) {
        toast({
          title: "Error",
          description: "Staff member not found",
          variant: "destructive"
        });
        return;
      }

      // Delete from staff table
      const deleteReq = {
        id: staffToDelete.id,
        version: 0 // You might need to get the actual version
      };
      
      const deleteResponse = await staffService.delete(deleteReq);
      
      if (deleteResponse) {
        console.log('✅ Staff deleted successfully - backend will handle user locationid update');
        
        toast({
          title: "Staff Removed",
          description: `${staffToDelete.name} has been removed from your staff and their location access has been revoked.`,
        });
        
        // Reload staff list
        await refetchStaff();
      } else {
        toast({
          title: "Error",
          description: "Failed to remove staff member",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error removing staff:', error);
      toast({
        title: "Error",
        description: "Failed to remove staff member",
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
      setStaffToDelete(null);
    }
  };

  // Get selected location name
  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

  return (
    <OrganizationPageShell embedded={embedded}>
      {embedded ? (
        <SettingsEmbeddedHeader
          icon={UsersIcon}
          title="Staff"
          description="Manage your staff members and their permissions."
        />
      ) : null}
      <div className={cn(embedded ? settingsEmbedded.sectionBody : "space-y-6")}>
        {!embedded ? (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="p-2"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList
            className={cn(
              embedded ?
                cn(org.segmentGroup, "inline-flex w-full max-w-full gap-1 border border-stone-200 bg-white p-1 shadow-none")
              : undefined
            )}
          >
            <TabsTrigger
              value="list"
              className={cn(
                embedded &&
                  "flex-1 rounded-xl font-semibold data-[state=active]:bg-none data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none"
              )}
            >
              Staff List
            </TabsTrigger>
            <TabsTrigger
              value="add"
              className={cn(
                embedded &&
                  "flex-1 rounded-xl font-semibold data-[state=active]:bg-none data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none"
              )}
            >
              Add Staff
            </TabsTrigger>
          </TabsList>

          {/* Staff List Tab */}
          <TabsContent value="list">
            <Card className={cn(settingsEmbedded.card(embedded), "w-full rounded-2xl border-stone-200 bg-white shadow-none")}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-appointza-navy">
                  <UsersIcon className="h-5 w-5 text-blue-600" />
                  <span>Current Staff Members</span>
                </CardTitle>
                <CardDescription>
                  View and manage your current staff members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStaff ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading staff...</span>
                  </div>
                ) : staffList.length === 0 ? (
                  <div className="text-center py-8">
                    <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Staff Members</h3>
                    <p className="text-gray-600 mb-4">You haven't added any staff members yet.</p>
                    <Button onClick={() => setActiveTab("add")}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Your First Staff Member
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {staffList.map((staff) => (
                      <div
                        key={staff.id}
                        className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-none transition-colors hover:border-blue-200 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                            <UsersIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold text-gray-900">{staff.name}</h3>
                            <p className="truncate text-sm text-gray-600">{staff.mobile}</p>
                            {staff.email && (
                              <p className="truncate text-sm text-gray-500">{staff.email}</p>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {staff.locationname || 'No Location'}
                              </Badge>
                              <Badge variant={staff.isactive ? "default" : "secondary"} className="text-xs">
                                {staff.isactive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 pt-3 sm:border-t-0 sm:pt-0">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditStaff(staff)}
                            className="h-9 w-9 shrink-0 p-0"
                            aria-label={`Edit ${staff.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemoveStaff(staff.id, staff.name, staff.userid)}
                            className="h-9 w-9 shrink-0 p-0 text-red-600 hover:text-red-700"
                            aria-label={`Remove ${staff.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Staff Tab */}
          <TabsContent value="add">
            <div className="space-y-6">
              {/* Search Section */}
              <Card className="rounded-2xl border-stone-200 bg-white shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5 text-blue-600" />
                    <span>Search User</span>
                  </CardTitle>
                  <CardDescription>
                    Search for a user by their mobile number to add them as staff
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Enter mobile number..."
                        value={searchMobile}
                        onChange={(e) => setSearchMobile(e.target.value)}
                        className="pl-10"
                        onKeyPress={(e) => e.key === 'Enter' && searchUserByMobile()}
                      />
                    </div>
                    <Button 
                      onClick={searchUserByMobile}
                      disabled={isSearching || !searchMobile.trim()}
                      className="px-6"
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Search
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Found User Display */}
              {foundUser && (
                <Card className="rounded-2xl border-green-200 bg-white shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>User Found</span>
                    </CardTitle>
                    <CardDescription>
                      Review user details before adding to staff
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {foundUser.name}
                        </h3>
                        <p className="text-gray-600">{foundUser.mobile}</p>
                        {foundUser.email && (
                          <p className="text-sm text-gray-500">{foundUser.email}</p>
                        )}
                        {(foundUser.city || foundUser.country) && (
                          <p className="text-sm text-gray-500">
                            {foundUser.city}, {foundUser.country}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Location Selection */}
              {foundUser && (
                <Card className="rounded-2xl border-stone-200 bg-white shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <span>Assign Location</span>
                    </CardTitle>
                    <CardDescription>
                      Select the business location for this staff member
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full md:w-1/2">
                      <Label htmlFor="location">Business Location</Label>
                      <Select value={selectedLocationId.toString()} onValueChange={(value) => setSelectedLocationId(Number(value))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              <div className="flex items-center space-x-2">
                                <Shield className="h-4 w-4 text-gray-500" />
                                <span>{location.name}</span>
                                {location.city && (
                                  <span className="text-gray-500">- {location.city}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Privileges Assignment */}
              {foundUser && (
                <Card className="rounded-2xl border-stone-200 bg-white shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                      <span>Assign Privileges</span>
                    </CardTitle>
                    <CardDescription>
                      Select the permissions this staff member should have
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Dashboard */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Dashboard</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="editandviewDashboard"
                              checked={privileges.editandviewDashboard}
                              onCheckedChange={(checked) => handlePrivilegeChange('editandviewDashboard', checked as boolean)}
                            />
                            <Label htmlFor="editandviewDashboard" className="text-sm">
                              Edit & View Dashboard
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Appointments */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Appointments</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="editandviewAppointments"
                              checked={privileges.editandviewAppointments}
                              onCheckedChange={(checked) => handlePrivilegeChange('editandviewAppointments', checked as boolean)}
                            />
                            <Label htmlFor="editandviewAppointments" className="text-sm">
                              Edit & View Appointments
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Events */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Events</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="editandviewEvents"
                              checked={privileges.editandviewEvents}
                              onCheckedChange={(checked) => handlePrivilegeChange('editandviewEvents', checked as boolean)}
                            />
                            <Label htmlFor="editandviewEvents" className="text-sm">
                              Edit & View Events
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Create Service */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Create Service</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="editandviewCreateService"
                              checked={privileges.editandviewCreateService}
                              onCheckedChange={(checked) => handlePrivilegeChange('editandviewCreateService', checked as boolean)}
                            />
                            <Label htmlFor="editandviewCreateService" className="text-sm">
                              Edit & View Create Service
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Create Event */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Create Event</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="editandviewCreateEvent"
                              checked={privileges.editandviewCreateEvent}
                              onCheckedChange={(checked) => handlePrivilegeChange('editandviewCreateEvent', checked as boolean)}
                            />
                            <Label htmlFor="editandviewCreateEvent" className="text-sm">
                              Edit & View Create Event
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Clients */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Clients</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="editandviewClients"
                              checked={privileges.editandviewClients}
                              onCheckedChange={(checked) => handlePrivilegeChange('editandviewClients', checked as boolean)}
                            />
                            <Label htmlFor="editandviewClients" className="text-sm">
                              Edit & View Clients
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Business Hours */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Business Hours</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="editandviewBusinessHours"
                              checked={privileges.editandviewBusinessHours}
                              onCheckedChange={(checked) => handlePrivilegeChange('editandviewBusinessHours', checked as boolean)}
                            />
                            <Label htmlFor="editandviewBusinessHours" className="text-sm">
                              Edit & View Business Hours
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Staff Management */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Staff Management</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="editandviewStaffManagement"
                              checked={privileges.editandviewStaffManagement}
                              onCheckedChange={(checked) => handlePrivilegeChange('editandviewStaffManagement', checked as boolean)}
                            />
                            <Label htmlFor="editandviewStaffManagement" className="text-sm">
                              Edit & View Staff Management
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Location Management */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Location Management</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="editandviewLocationManagement"
                              checked={privileges.editandviewLocationManagement}
                              onCheckedChange={(checked) => handlePrivilegeChange('editandviewLocationManagement', checked as boolean)}
                            />
                            <Label htmlFor="editandviewLocationManagement" className="text-sm">
                              Edit & View Location Management
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Templates */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Templates</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="editandviewTemplates"
                              checked={privileges.editandviewTemplates}
                              onCheckedChange={(checked) => handlePrivilegeChange('editandviewTemplates', checked as boolean)}
                            />
                            <Label htmlFor="editandviewTemplates" className="text-sm">
                              Edit & View Templates
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Payment Settings */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Payment Settings</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="editandviewPaymentSettings"
                              checked={privileges.editandviewPaymentSettings}
                              onCheckedChange={(checked) => handlePrivilegeChange('editandviewPaymentSettings', checked as boolean)}
                            />
                            <Label htmlFor="editandviewPaymentSettings" className="text-sm">
                              Edit & View Payment Settings
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Business Values */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Business Values</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="editandviewBusinessvalues"
                              checked={privileges.editandviewBusinessvalues}
                              onCheckedChange={(checked) => handlePrivilegeChange('editandviewBusinessvalues', checked as boolean)}
                            />
                            <Label htmlFor="editandviewBusinessvalues" className="text-sm">
                              Edit & View Business Values
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              {foundUser && (
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchMobile('');
                      setFoundUser(null);
                      setPrivileges({
                        editandviewDashboard: false,
                        editandviewAppointments: false,
                        editandviewEvents: false,
                        editandviewCreateService: false,
                        editandviewCreateEvent: false,
                        editandviewClients: false,
                        editandviewBusinessHours: false,
                        editandviewStaffManagement: false,
                        editandviewLocationManagement: false,
                        editandviewTemplates: false,
                        editandviewPaymentSettings: false,
                        editandviewBusinessvalues: false,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={!selectedLocationId}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Staff Member
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl border-stone-200 bg-white shadow-none">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Add Staff</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to add <strong>{foundUser.name}</strong> as a staff member 
                          {selectedLocation && ` at ${selectedLocation.name}`}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleAddStaff}
                          disabled={isAdding}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isAdding ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <UserPlus className="h-4 w-4 mr-2" />
                          )}
                          Add Staff
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="rounded-2xl border-stone-200 bg-white shadow-none">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <strong>{staffToDelete?.name}</strong> from your staff? 
                This will also revoke their location access by clearing their location ID. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteStaff}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Staff
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Staff Dialog */}
        {mountEditStaffDialog ? (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-2xl border-stone-200 bg-white shadow-none">
            <DialogHeader>
              <DialogTitle>Edit Staff Privileges - {editingStaff?.name}</DialogTitle>
              <DialogDescription>
                Update the privileges and location for this staff member
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Location Selection */}
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Select value={selectedLocationId.toString()} onValueChange={(value) => setSelectedLocationId(Number(value))}>
                  <SelectTrigger id="edit-location">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Privileges Assignment - Same as Add Staff */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Privileges</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Dashboard */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm text-gray-700">Dashboard</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-editandviewDashboard"
                          checked={privileges.editandviewDashboard}
                          onCheckedChange={(checked) => handlePrivilegeChange('editandviewDashboard', checked as boolean)}
                        />
                        <Label htmlFor="edit-editandviewDashboard" className="text-sm">Edit & View Dashboard</Label>
                      </div>
                    </div>
                  </div>

                  {/* Appointments */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm text-gray-700">Appointments</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-editandviewAppointments"
                          checked={privileges.editandviewAppointments}
                          onCheckedChange={(checked) => handlePrivilegeChange('editandviewAppointments', checked as boolean)}
                        />
                        <Label htmlFor="edit-editandviewAppointments" className="text-sm">Edit & View Appointments</Label>
                      </div>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm text-gray-700">Events</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-editandviewEvents"
                          checked={privileges.editandviewEvents}
                          onCheckedChange={(checked) => handlePrivilegeChange('editandviewEvents', checked as boolean)}
                        />
                        <Label htmlFor="edit-editandviewEvents" className="text-sm">Edit & View Events</Label>
                      </div>
                    </div>
                  </div>

                  {/* Create Service */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm text-gray-700">Create Service</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-editandviewCreateService"
                          checked={privileges.editandviewCreateService}
                          onCheckedChange={(checked) => handlePrivilegeChange('editandviewCreateService', checked as boolean)}
                        />
                        <Label htmlFor="edit-editandviewCreateService" className="text-sm">Edit & View Create Service</Label>
                      </div>
                    </div>
                  </div>

                  {/* Create Event */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm text-gray-700">Create Event</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-editandviewCreateEvent"
                          checked={privileges.editandviewCreateEvent}
                          onCheckedChange={(checked) => handlePrivilegeChange('editandviewCreateEvent', checked as boolean)}
                        />
                        <Label htmlFor="edit-editandviewCreateEvent" className="text-sm">Edit & View Create Event</Label>
                      </div>
                    </div>
                  </div>

                  {/* Clients */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm text-gray-700">Clients</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-editandviewClients"
                          checked={privileges.editandviewClients}
                          onCheckedChange={(checked) => handlePrivilegeChange('editandviewClients', checked as boolean)}
                        />
                        <Label htmlFor="edit-editandviewClients" className="text-sm">Edit & View Clients</Label>
                      </div>
                    </div>
                  </div>

                  {/* Business Hours */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm text-gray-700">Business Hours</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-editandviewBusinessHours"
                          checked={privileges.editandviewBusinessHours}
                          onCheckedChange={(checked) => handlePrivilegeChange('editandviewBusinessHours', checked as boolean)}
                        />
                        <Label htmlFor="edit-editandviewBusinessHours" className="text-sm">Edit & View Business Hours</Label>
                      </div>
                    </div>
                  </div>

                  {/* Staff Management */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm text-gray-700">Staff Management</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-editandviewStaffManagement"
                          checked={privileges.editandviewStaffManagement}
                          onCheckedChange={(checked) => handlePrivilegeChange('editandviewStaffManagement', checked as boolean)}
                        />
                        <Label htmlFor="edit-editandviewStaffManagement" className="text-sm">Edit & View Staff Management</Label>
                      </div>
                    </div>
                  </div>

                  {/* Location Management */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm text-gray-700">Location Management</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-editandviewLocationManagement"
                          checked={privileges.editandviewLocationManagement}
                          onCheckedChange={(checked) => handlePrivilegeChange('editandviewLocationManagement', checked as boolean)}
                        />
                        <Label htmlFor="edit-editandviewLocationManagement" className="text-sm">Edit & View Location Management</Label>
                      </div>
                    </div>
                  </div>

                  {/* Templates */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm text-gray-700">Templates</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-editandviewTemplates"
                          checked={privileges.editandviewTemplates}
                          onCheckedChange={(checked) => handlePrivilegeChange('editandviewTemplates', checked as boolean)}
                        />
                        <Label htmlFor="edit-editandviewTemplates" className="text-sm">Edit & View Templates</Label>
                      </div>
                    </div>
                  </div>

                  {/* Payment Settings */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm text-gray-700">Payment Settings</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-editandviewPaymentSettings"
                          checked={privileges.editandviewPaymentSettings}
                          onCheckedChange={(checked) => handlePrivilegeChange('editandviewPaymentSettings', checked as boolean)}
                        />
                        <Label htmlFor="edit-editandviewPaymentSettings" className="text-sm">Edit & View Payment Settings</Label>
                      </div>
                    </div>
                  </div>

                  {/* Business Values */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm text-gray-700">Business Values</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-editandviewBusinessvalues"
                          checked={privileges.editandviewBusinessvalues}
                          onCheckedChange={(checked) => handlePrivilegeChange('editandviewBusinessvalues', checked as boolean)}
                        />
                        <Label htmlFor="edit-editandviewBusinessvalues" className="text-sm">Edit & View Business Values</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingStaff(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStaff}
                disabled={isAdding || !selectedLocationId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Edit className="h-4 w-4 mr-2" />
                )}
                Update Staff
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        ) : null}
      </div>
    </OrganizationPageShell>
  );
};

export default StaffManagement;
