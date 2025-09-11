export class AppointmentSummary {
  id: number = 0;
  userid: number = 0;
  username: string = "";
  useremail: string = "";
  usermobile: string = "";
  
  // Organization Details
  organisationid: number = 0;
  organisationname: string = "";
  organisationaddress: string = "";
  organisationphone: string = "";
  organisationemail: string = "";
  
  // Location Details
  organisationlocationid: number = 0;
  locationname: string = "";
  locationaddress: string = "";
  locationphone: string = "";
  
  // Appointment Details
  appointmentdate: Date = new Date();
  fromtime: string = "";
  totime: string = "";
  status: string = "";
  statuscode: string = "";
  createdon: Date = new Date();
  modifiedon: Date = new Date();
  
  // Staff Details
  staffid?: number;
  staffname: string = "";
  staffphone: string = "";
  staffemail: string = "";
  
  // Payment Details
  paymentid?: number;
  totalamount: number = 0;
  paymentstatus: string = "";
  paymentmethod: string = "";
  paymentreference: string = "";
  paymentdate?: Date;
  
  // Services
  services: AppointmentServiceSummary[] = [];
  
  // Timeline
  timeline: AppointmentTimelineSummary[] = [];
  
  // Additional Information
  notes: string = "";
  attributes: { [key: string]: any } = {};
}

export class AppointmentServiceSummary {
  serviceid: number = 0;
  servicename: string = "";
  servicedescription: string = "";
  serviceprice: number = 0;
  duration: number = 0; // in minutes
  category: string = "";
}

export class AppointmentTimelineSummary {
  id: number = 0;
  taskcode: string = "";
  tasktype: string = "";
  description: string = "";
  staffname: string = "";
  status: string = "";
  createdon: Date = new Date();
  notes: string = "";
}

export class AppointmentSummarySelectReq {
  appointmentid: number = 0;
}
