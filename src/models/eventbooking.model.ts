export class EventBooking {
  id: number = 0;
  event_id: number = 0;
  user_id: number = 0;
  number_of_people: number = 1;
  total_amount: number | null = null;
  payment_status: string = "pending"; // 'pending', 'paid', 'failed', 'refunded'
  payment_reference: string = "";
  check_in_status: string = "not_checked_in"; // 'not_checked_in', 'checked_in', 'cancelled'
  confirmation_status: string = "pending"; // 'pending', 'approved', 'rejected'
  notes: string = ""; // Stores names when number_of_people > 1
  created_at: Date = new Date();
  updated_at: Date = new Date();
  isactive: boolean = true;
  user_name: string = ""; // User's name from users table
  user_mobile: string = ""; // User's mobile number from users table
}

export class EventBookingSelectReq {
  id: number = 0;
  event_id: number = 0;
  user_id: number = 0;
  payment_status: string = "";
  check_in_status: string = "";
  confirmation_status: string = "";
}

export class EventBookingDeleteReq {
  id: number = 0;
}

