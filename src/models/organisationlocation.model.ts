export class OrganisationLocation {
  id: number = 0
organisationid: number = 0
name: string = ""
addressline1: string = ""
addressline2: string = ""
city: string = ""
state: string = ""
district:string=""
country: string = ""
latitude: number = 0
longitude: number = 0
googlelocation: string = ""
pincode: string = ""
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: OrganisationLocation.AttributesData = new OrganisationLocation.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
  images: number[] = [];
}

export namespace OrganisationLocation {
  
                export class AttributesData
                {
                    
                }  
                
}

export class OrganisationLocationSelectReq {
  id: number = 0;
  organisationid: number = 0
}

export class OrganisationLocationDeleteReq {
  id: number = 0;
  version: number = 0;
}

export class OrganisationLocationStaffReq {
  userid: number=0;
}

export class OrganisationLocationStaffRes {
  organisationid: number=0;
  name: string='';
  organisationlocationid: number=0;
}



// Request model - for the request sent to the method
export class OrgLocationStaffRequest {
  businessName: string ='';
  area: string ='';
  city: string ='';
  state: string ='';
  postalCode: string ='';
  serviceIds: number[] = []; // A list of service IDs to filter by
}

export class OrgLocationStaffResponse {
  BusinessName: string = '';
  StreetName: string = '';
  Area: string = '';
  City: string = '';
  State: string = '';
  PostalCode: string = '';
  Services: Service[] = [];
  Timings: Timing[] = [];
}

export class Service {
  ServiceName: string = '';
  Price: number = 0;
  OfferPrice: number = 0;
  Duration: number = 0; // Duration in minutes
}

export class Timing {
  Day: number = 0; // Day of the week (1 = Monday, 2 = Tuesday, etc.)
  StartTime: string = ''; // Changed from TimeSpan to string for TypeScript
  EndTime: string = ''; // Changed from TimeSpan to string for TypeScript
}
export class OrgLocationReq{
  orglocid :number =0
}

export class PaymentSummary {
  paymentmodetype: string='';
  totalamount: number=0;
}

export class AppointmentPaymentsummary {
  totalappointments: number=0;
  confirmedcount: number=0;
  completedcount: number=0;
  paymentsummary: PaymentSummary[]=[];
}
