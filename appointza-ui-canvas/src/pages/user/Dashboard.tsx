import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  DollarSign, 
  RefreshCw, 
  Loader2,
  Activity,
  TrendingUp,
  Users,
  MapPin,
  Star,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AppoinmentService } from "@/services/appoinment.service";
import { BookedAppoinmentRes, AppoinmentSelectReq, SelectedSerivice } from "@/models/appoinment.model";
import { ReviewService } from "@/services/review.service";
import { Review, ReviewSelectReq } from "@/models/review.model";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  countAppointmentsByStatus,
  isUpcomingAppointmentStatus,
  normalizeAppointmentStatusCode,
  toAppointmentStatusBucket,
} from "@/utils/appointmentStatus.util";

const UserDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // API services
  const appointmentService = useMemo(() => new AppoinmentService(), []);
  const reviewService = useMemo(() => new ReviewService(), []);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<BookedAppoinmentRes[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Review dialog state
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedServiceForReview, setSelectedServiceForReview] = useState<SelectedSerivice | null>(null);
  const [selectedAppointmentForReview, setSelectedAppointmentForReview] = useState<BookedAppoinmentRes | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Dashboard stats
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<BookedAppoinmentRes[]>([]);

  // Status colors (keyed by normalized bucket)
  const statusColors: Record<string, string> = {
    CONFIRMED: "bg-gray-100 text-gray-800",
    PENDING: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    COMPLETED: "bg-gray-100 text-gray-800",
  };

  // Load appointments
  const loadAppointments = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      console.log('❌ Dashboard: Not authenticated or no user ID');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Loading user appointments for user ID:', user.id);
      
      const req = new AppoinmentSelectReq();
      req.userid = user.id;
      
      console.log('🔍 Appointment request object:', req);
      
      const response = await appointmentService.SelectBookedAppoinment(req);
      console.log('✅ User appointments API response:', response);
      
      if (response) {
        setAppointments(response);
        calculateDashboardStats(response);
      } else {
        console.log('⚠️ No appointments returned, setting empty array');
        setAppointments([]);
        calculateDashboardStats([]);
      }
    } catch (error) {
      console.error('❌ Error loading appointments:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Set empty data instead of showing error
      setAppointments([]);
      calculateDashboardStats([]);
      
      toast({
        title: "Warning",
        description: "Could not load appointments. Showing empty dashboard.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, appointmentService, toast]);

  // Calculate dashboard statistics
  const calculateDashboardStats = useCallback((appointments: BookedAppoinmentRes[]) => {
    const counts = countAppointmentsByStatus(appointments);
    setTotalAppointments(counts.total);
    setConfirmedCount(counts.confirmed);
    setPendingCount(counts.pending);
    setCancelledCount(counts.cancelled);
    setCompletedCount(counts.completed);

    // Calculate total spent
    const spent = appointments.reduce((total, appointment) => {
      if (appointment.attributes?.servicelist) {
        return total + appointment.attributes.servicelist.reduce(
          (sum, service) => sum + (Number(service.serviceprice) || 0), 0
        );
      }
      return total;
    }, 0);
    setTotalSpent(spent);

    // Get upcoming appointments (next 7 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const upcoming = appointments
      .filter((appointment) => {
        const appDate = new Date(appointment.appoinmentdate);
        if (Number.isNaN(appDate.getTime())) return false;
        appDate.setHours(0, 0, 0, 0);
        return (
          appDate >= today &&
          appDate <= nextWeek &&
          isUpcomingAppointmentStatus(appointment.statuscode)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.appoinmentdate).getTime() - new Date(b.appoinmentdate).getTime(),
      );

    setUpcomingAppointments(upcoming.slice(0, 3)); // Show only next 3 upcoming
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAppointments();
    } catch (error) {
      console.error('Error refreshing appointments:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format time
  const formatTime = (timeString: string) => {
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Load reviews
  const loadReviews = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const req = new ReviewSelectReq();
      req.user_id = user.id;
      const response = await reviewService.select(req);
      setReviews(response || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  }, [user?.id, reviewService]);

  // Open review dialog
  const openReviewDialog = (service: SelectedSerivice, appointment: BookedAppoinmentRes) => {
    setSelectedServiceForReview(service);
    setSelectedAppointmentForReview(appointment);
    setReviewRating(5);
    setReviewComment("");
    setShowReviewDialog(true);
  };

  // Check if service already has a review
  const hasReviewedService = (serviceId: number): boolean => {
    return reviews.some(review => review.organisation_service_id === serviceId);
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!selectedServiceForReview || !user?.id) return;
    
    if (reviewRating < 1 || reviewRating > 5) {
      toast({
        title: "Invalid Rating",
        description: "Please select a rating between 1 and 5 stars",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingReview(true);
    try {
      const review = new Review();
      review.user_id = user.id;
      review.organisation_service_id = selectedServiceForReview.id;
      review.rating = reviewRating;
      review.comment = reviewComment.trim();
      
      await reviewService.insert(review);
      
      toast({
        title: "Success",
        description: "Thank you for your review!",
      });
      
      // Refresh reviews and appointments
      await loadReviews();
      await loadAppointments();
      
      setShowReviewDialog(false);
      setSelectedServiceForReview(null);
      setSelectedAppointmentForReview(null);
      setReviewRating(5);
      setReviewComment("");
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    console.log('🔍 Dashboard useEffect triggered');
    loadAppointments();
    loadReviews();
  }, [loadAppointments, loadReviews]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Dashboard loading timeout - setting loading to false');
        setIsLoading(false);
        toast({
          title: "Timeout",
          description: "Loading took too long. Please try refreshing.",
          variant: "destructive"
        });
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Welcome back, {user?.username || user?.email}</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center space-x-2 w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Stats Overview — 2 cols until xl so sidebar width does not clip labels */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5 sm:gap-4">
          {(
            [
              { label: "Total Appointments", value: totalAppointments, icon: Activity },
              { label: "Confirmed", value: confirmedCount, icon: CheckCircle },
              { label: "Pending", value: pendingCount, icon: Clock },
              { label: "Cancelled", value: cancelledCount, icon: XCircle },
              { label: "Completed", value: completedCount, icon: TrendingUp },
            ] as const
          ).map(({ label, value, icon: Icon }) => (
            <Card key={label} className="min-w-0 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="shrink-0 rounded-full bg-gray-100 p-2">
                    <Icon className="h-5 w-5 text-gray-600 sm:h-6 sm:w-6" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold tabular-nums text-gray-900">{value}</p>
                    <p className="break-words text-sm leading-snug text-gray-600">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>


        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <Calendar className="h-5 w-5" />
                <span>Upcoming Appointments</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Your next few appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                          {appointment.organisationname}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(appointment.appoinmentdate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })} • {formatTime(appointment.fromtime)} - {formatTime(appointment.totime)}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${statusColors[toAppointmentStatusBucket(appointment.statuscode)] || 'bg-gray-100 text-gray-800'} text-xs sm:text-sm px-2 sm:px-3 py-1 w-fit`}>
                      {normalizeAppointmentStatusCode(appointment.statuscode) || "PENDING"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Your recent appointments and reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments
                  .sort((a, b) => new Date(b.createdon).getTime() - new Date(a.createdon).getTime())
                  .slice(0, 10)
                  .map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Icon and Main Content */}
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {(() => {
                            const bucket = toAppointmentStatusBucket(appointment.statuscode);
                            if (bucket === "COMPLETED") {
                              return <CheckCircle className="h-5 w-5 text-blue-600" />;
                            }
                            if (bucket === "CANCELLED") {
                              return <XCircle className="h-5 w-5 text-red-600" />;
                            }
                            if (bucket === "CONFIRMED") {
                              return <CheckCircle className="h-5 w-5 text-green-600" />;
                            }
                            return <Clock className="h-5 w-5 text-yellow-600" />;
                          })()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                            {appointment.organisationname}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(appointment.appoinmentdate).toLocaleDateString()} • {formatTime(appointment.fromtime)}
                          </p>
                          {appointment.attributes?.servicelist && appointment.attributes.servicelist.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs sm:text-sm text-gray-500 break-words">
                                Services: {appointment.attributes.servicelist.map(s => s.servicename).join(', ')}
                              </p>
                            </div>
                          )}
                          {toAppointmentStatusBucket(appointment.statuscode) === "COMPLETED" && appointment.attributes?.servicelist && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {appointment.attributes.servicelist.map((service) => (
                                <Button
                                  key={service.id}
                                  size="sm"
                                  variant={hasReviewedService(service.id) ? "outline" : "default"}
                                  className="text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
                                  onClick={() => openReviewDialog(service, appointment)}
                                  disabled={hasReviewedService(service.id)}
                                >
                                  {hasReviewedService(service.id) ? (
                                    <>
                                      <Star className="mr-1 h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                                      Reviewed
                                    </>
                                  ) : (
                                    <>
                                      <Star className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                                      Rate & Review
                                    </>
                                  )}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right Side: Badge, Price, Button */}
                      <div className="flex flex-col sm:flex-col items-start sm:items-end gap-2 sm:gap-2 sm:text-right w-full sm:w-auto">
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                          <Badge className={`${statusColors[toAppointmentStatusBucket(appointment.statuscode)] || 'bg-gray-100 text-gray-800'} text-xs sm:text-sm px-2 sm:px-3 py-1`}>
                            {normalizeAppointmentStatusCode(appointment.statuscode) || "PENDING"}
                          </Badge>
                          {appointment.attributes?.servicelist && appointment.attributes.servicelist.length > 0 && (
                            <p className="text-sm sm:text-base font-medium text-gray-900">
                              ₹{appointment.attributes.servicelist.reduce(
                                (sum, service) => sum + (Number(service.serviceprice) || 0), 0
                              ).toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base h-9 sm:h-10 px-4 sm:px-6"
                          onClick={() => {
                            window.location.href = `/book-appointment/${appointment.organizationid}/${appointment.organisationlocationid}`;
                          }}
                        >
                          Book Appointment
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
                <p className="text-gray-600 mb-4 px-4">You haven't made any appointments yet.</p>
                <Button onClick={() => window.location.href = '/explore'} className="w-full sm:w-auto">
                  Browse Services
                </Button>
              </div>
            )}
            
            {/* Show reviews in Recent Activity */}
            {reviews.length > 0 && (
              <div className="space-y-4 mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 px-2 sm:px-0">Your Reviews</h3>
                {reviews
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                  .map((review) => (
                    <div
                      key={review.id}
                      className="flex items-start gap-3 sm:gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                            Service Review
                          </h3>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {new Date(review.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        {review.comment && (
                          <p className="text-sm sm:text-base text-gray-700 mt-2 italic break-words">
                            "{review.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Rate & Review Service</DialogTitle>
              <DialogDescription>
                Share your experience with {selectedServiceForReview?.servicename || 'this service'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="rating">Rating</Label>
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= reviewRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {reviewRating} / 5
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="comment">Your Review</Label>
                <Textarea
                  id="comment"
                  placeholder="Share your thoughts about this service..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewDialog(false);
                  setSelectedServiceForReview(null);
                  setSelectedAppointmentForReview(null);
                }}
                disabled={isSubmittingReview}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || reviewRating < 1}
              >
                {isSubmittingReview ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Submit Review
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default UserDashboard;