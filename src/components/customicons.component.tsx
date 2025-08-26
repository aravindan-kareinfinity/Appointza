import * as React from 'react';
import {AppView} from './appview.component';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Mask,
  Path,
  Rect,
} from 'react-native-svg';
export enum CustomIcons {
  Orders,
  Catelogue,
  Image,
  Design,
  Chat,

  Settings,
  AddAccount,
  RightChevron,
  LeftArrow,
  AddSquareRounded,

  Dot,
  Circle,
  Logout,
  Shop,
  DoubleTick,
  SingleTick,
  Camera,
  Post,
  Camera2,
  Expand,
  Share,
  Like,
  Plus,
  Minus,
  AddImage,
  Send,
  CheckBox,
  Cart,
  Bell,
  RadioUnchecked,
  RadioChecked,
  Edit,
  Eye,
  UpChevron,
  CloseCircle,

  Delete,
  FazharLogo,
  QRCode,
  DownChevron,
  Supplier,
  Retailer,
  Filter,
  Global,
  Back,
  Close,
  Diagram,
  Expand_more,
  FullScreen,
  Group1,
  Account,
  Associate,
  Dissociate,
  Order,
  Group232,
  PasswordKey1,
  PasswordKey2,
  Group245,
  Fingerprint,
  Email,
  Information,
  Male,
  Menu,
  Page1,
  Search,
  Set,
  Home,
  Passwordnotvisible,
  Passwordvisible,
  History,
  Vector3,
  Vector4,
  Vector5,
  Vector6,
  Warning,
  Qrcode,
  DefaultIcon,
  Server,
  Save,
  GreenTick,

  RightArrow,
  HelpCircle,
  Tick,
  Clock,
  Cancel,
  Scheduled,
  Completed,
  PlayCircle,
  PauseCircle,
  AccountBox,
  Location,
  Refresh, // Add these new icons at the end of the CustomIcons enum
  Appointment,
  AppointmentCalendar,
  BusinessProfile,
  ServiceList,
  LocationPin,
  TimeSlot,
  Notification,
  UserProfile,
  Dashboard,
  StatusIndicator,
  TimeCard,
  CashPayment,
  OnlinePayment,
  GroupAppointment,
  Payment,
  Date,
}
type Props = {
  size: number;
  color: string;
  name: CustomIcons;
  stroke?: number;
};
export const CustomIcon = (props: Props) => {
  const [stroke, setStroke] = React.useState(3);
  React.useEffect(() => {
    if (props.stroke) {
      setStroke(props.stroke);
    }
  }, [props]);
  switch (props.name) {
    case CustomIcons.Orders:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M38 16.4C37.9332 14.0401 37.7085 12.5355 36.9519 11.2515C35.8758 9.42541 33.9378 8.40919 30.0617 6.37674L26.4589 4.48755C23.2964 2.82919 21.7151 2 20.0141 2C18.313 2 16.7317 2.82919 13.5691 4.48755L9.96634 6.37674C6.09032 8.40919 4.1523 9.42541 3.07616 11.2515C2 13.0776 2 15.35 2 19.8947V20.1053C2 24.6499 2 26.9224 3.07616 28.7485C4.1523 30.5746 6.09032 31.5907 9.96634 33.6233L13.5691 35.5124C16.7317 37.1707 18.313 38 20.0141 38C21.7151 38 23.2964 37.1707 26.4589 35.5124L30.0617 33.6233C33.9378 31.5907 35.8758 30.5746 36.9519 28.7485C37.7085 27.4644 37.9332 25.96 38 23.6"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M36.2267 11.9L29.0211 15.5M29.0211 15.5C29.0211 15.5 28.4722 15.7743 28.1204 15.95C24.9546 17.5317 20.014 20 20.014 20M29.0211 15.5V21.8M29.0211 15.5L11.9077 6.5M20.014 20L3.80139 11.9M20.014 20V37.1"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );

    case CustomIcons.Dashboard:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M6.66667 20H13.3333"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M6.66667 10H13.3333"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M6.66667 30H13.3333"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M16.6667 6.66667H33.3333C34.8061 6.66667 36 7.86058 36 9.33333V13.3333C36 14.8061 34.8061 16 33.3333 16H16.6667C15.1939 16 14 14.8061 14 13.3333V9.33333C14 7.86058 15.1939 6.66667 16.6667 6.66667Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M16.6667 24H33.3333C34.8061 24 36 25.1939 36 26.6667V30.6667C36 32.1394 34.8061 33.3333 33.3333 33.3333H16.6667C15.1939 33.3333 14 32.1394 14 30.6667V26.6667C14 25.1939 15.1939 24 16.6667 24Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.StatusIndicator:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Circle
            cx="20"
            cy="20"
            r="16"
            stroke={props.color}
            strokeWidth={stroke}
          />
          <Circle cx="20" cy="20" r="8" fill={props.color} />
        </Svg>
      );

    case CustomIcons.TimeCard:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M33.3333 6.66667H6.66667C5.19391 6.66667 4 7.86058 4 9.33333V30.6667C4 32.1394 5.19391 33.3333 6.66667 33.3333H33.3333C34.8061 33.3333 36 32.1394 36 30.6667V9.33333C36 7.86058 34.8061 6.66667 33.3333 6.66667Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M4 13.3333H36"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M20 20L26.6667 23.3333L20 26.6667V20Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.3333 20H20"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.CashPayment:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M33.3333 6.66667H6.66667C5.19391 6.66667 4 7.86058 4 9.33333V30.6667C4 32.1394 5.19391 33.3333 6.66667 33.3333H33.3333C34.8061 33.3333 36 32.1394 36 30.6667V9.33333C36 7.86058 34.8061 6.66667 33.3333 6.66667Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M20 26.6667C23.6819 26.6667 26.6667 23.6819 26.6667 20C26.6667 16.3181 23.6819 13.3333 20 13.3333C16.3181 13.3333 13.3333 16.3181 13.3333 20C13.3333 23.6819 16.3181 26.6667 20 26.6667Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M20 16.6667V23.3333"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M16.6667 20H23.3333"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.OnlinePayment:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M33.3333 6.66667H6.66667C5.19391 6.66667 4 7.86058 4 9.33333V30.6667C4 32.1394 5.19391 33.3333 6.66667 33.3333H33.3333C34.8061 33.3333 36 32.1394 36 30.6667V9.33333C36 7.86058 34.8061 6.66667 33.3333 6.66667Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M4 13.3333H36"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.3333 26.6667H26.6667"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M20 20L26.6667 23.3333L20 26.6667V20Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case CustomIcons.Appointment:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M33.3333 6.66667H6.66667C5.19391 6.66667 4 7.86058 4 9.33333V33.3333C4 34.8061 5.19391 36 6.66667 36H33.3333C34.8061 36 36 34.8061 36 33.3333V9.33333C36 7.86058 34.8061 6.66667 33.3333 6.66667Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M26.6667 4V9.33333"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.3333 4V9.33333"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M4 16H36"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.3333 24H26.6667"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.3333 30H20"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.BusinessProfile:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M20 20C23.6819 20 26.6667 17.0152 26.6667 13.3333C26.6667 9.65144 23.6819 6.66667 20 6.66667C16.3181 6.66667 13.3333 9.65144 13.3333 13.3333C13.3333 17.0152 16.3181 20 20 20Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M33.3333 33.3333C33.3333 27.1117 27.3333 22 20 22C12.6667 22 6.66667 27.1117 6.66667 33.3333"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M20 20V33.3333"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.ServiceList:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M33.3333 6.66667H6.66667C5.19391 6.66667 4 7.86058 4 9.33333V33.3333C4 34.8061 5.19391 36 6.66667 36H33.3333C34.8061 36 36 34.8061 36 33.3333V9.33333C36 7.86058 34.8061 6.66667 33.3333 6.66667Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.3333 16.6667H26.6667"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.3333 23.3333H26.6667"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.3333 30H20"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.LocationPin:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M20 21.6667C22.3012 21.6667 24.1667 19.8012 24.1667 17.5C24.1667 15.1988 22.3012 13.3333 20 13.3333C17.6988 13.3333 15.8333 15.1988 15.8333 17.5C15.8333 19.8012 17.6988 21.6667 20 21.6667Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M20 33.3333C26.6667 26.6667 33.3333 21.6667 33.3333 17.5C33.3333 13.3333 30 10 20 10C10 10 6.66667 13.3333 6.66667 17.5C6.66667 21.6667 13.3333 26.6667 20 33.3333Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.TimeSlot:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M20 36.6667C29.2047 36.6667 36.6667 29.2047 36.6667 20C36.6667 10.7953 29.2047 3.33333 20 3.33333C10.7953 3.33333 3.33333 10.7953 3.33333 20C3.33333 29.2047 10.7953 36.6667 20 36.6667Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M20 10V20L26.6667 23.3333"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.GroupAppointment:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M13.3333 16.6667C15.1743 16.6667 16.6667 15.1743 16.6667 13.3333C16.6667 11.4924 15.1743 10 13.3333 10C11.4924 10 10 11.4924 10 13.3333C10 15.1743 11.4924 16.6667 13.3333 16.6667Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M26.6667 16.6667C28.5076 16.6667 30 15.1743 30 13.3333C30 11.4924 28.5076 10 26.6667 10C24.8257 10 23.3333 11.4924 23.3333 13.3333C23.3333 15.1743 24.8257 16.6667 26.6667 16.6667Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M20 30C22.7614 30 25 27.7614 25 25C25 22.2386 22.7614 20 20 20C17.2386 20 15 22.2386 15 25C15 27.7614 17.2386 30 20 30Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 30C10 26.6863 11.3431 23.3333 13.3333 23.3333"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M30 30C30 26.6863 28.6569 23.3333 26.6667 23.3333"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.Payment:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M33.3333 6.66667H6.66667C5.19391 6.66667 4 7.86058 4 9.33333V30.6667C4 32.1394 5.19391 33.3333 6.66667 33.3333H33.3333C34.8061 33.3333 36 32.1394 36 30.6667V9.33333C36 7.86058 34.8061 6.66667 33.3333 6.66667Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M4 13.3333H36"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.3333 26.6667H20"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case CustomIcons.Catelogue:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M16.25 39C10.9467 39 8.29505 39 6.64753 37.3305C5 35.6609 5 32.974 5 27.6V12.4C5 7.02598 5 4.33898 6.64753 2.66949C8.29505 1 10.9467 1 16.25 1H23.75C29.0532 1 31.7049 1 33.3524 2.66949C35 4.33898 35 7.02598 35 12.4M23.75 39C29.0532 39 31.7049 39 33.3524 37.3305C35 35.6609 35 32.974 35 27.6V20"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M34.8084 27.5996H12.3083C10.5646 27.5996 9.69279 27.5996 8.97747 27.7938C7.03632 28.3208 5.52012 29.8574 5 31.8243"
            stroke={props.color}
            strokeWidth={stroke}
          />
          <Path
            d="M10.625 27.6002V14.3002M10.625 1.9502V6.7002"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M21.875 27.5996V34.3083C21.875 34.832 21.875 35.0938 21.6971 35.1996C21.5193 35.3054 21.2761 35.1884 20.7896 34.9541L18.4604 33.8331C18.2958 33.7539 18.2135 33.7142 18.125 33.7142C18.0365 33.7142 17.9542 33.7539 17.7896 33.8331L15.4604 34.9541C14.9739 35.1884 14.7307 35.3054 14.5528 35.1996C14.375 35.0938 14.375 34.832 14.375 34.3083V28.4546"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );
    case CustomIcons.Image:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M2 15.5V6.5C2 4.01472 4.01472 2 6.5 2H20M2.06059 34.2403C2.41366 36.3733 4.26687 38 6.5 38H33.5C35.9853 38 38 35.9853 38 33.5V24.9277M2.06059 34.2403C2.02074 33.9995 2 33.7522 2 33.5V26.75M2.06059 34.2403L10.6571 25.6437C12.1872 24.3049 14.4249 24.1582 16.1165 25.2861L17.2622 26.0498C18.8926 27.1368 21.0393 27.0436 22.5695 25.8194L28.5277 21.0528C30.0465 19.8378 32.1619 19.7424 33.7763 20.7839C33.9552 20.8993 34.1145 21.0422 34.265 21.1927L38 24.9277M38 24.9277V6.5C38 4.01472 35.9853 2 33.5 2H31.25M17.75 13.25C17.75 15.7353 15.7353 17.75 13.25 17.75C10.7647 17.75 8.75 15.7353 8.75 13.25C8.75 10.7647 10.7647 8.75 13.25 8.75C15.7353 8.75 17.75 10.7647 17.75 13.25Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case CustomIcons.Design:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <G>
            <Path
              d="M12.0716 15.0853L24.5517 11.5323C24.5517 11.5323 30.1608 11.4137 31.6831 8.86753C32.9303 6.78146 33.2717 4.49108 31.6831 2.64974C30.0784 0.789701 27.5635 0.515471 25.4431 1.76148C22.7277 3.35716 24.5517 9.75579 24.5517 9.75579C24.5517 9.75579 29.9002 28.4093 31.6831 31.0739C33.466 33.7386 35.0624 33.8316 37.0317 32.8504C39.001 31.8693 39.2567 29.6701 38.8146 27.5209C38.2132 24.5977 36.1403 23.0796 32.5745 23.0796C29.0088 23.0796 9.39738 27.521 7.61448 31.0739C5.83158 34.6268 6.26768 36.4926 8.50591 38.18C11.2401 40.2413 15.6374 38.1801 15.6374 34.6271C15.6374 26.6328 10.2888 10.644 8.50591 7.97927C6.72307 5.31451 3.29876 6.95029 2.26592 7.9794C1.23309 9.00852 0.0277518 10.8518 2.26592 14.1972C4.50409 17.5426 12.0716 15.0853 12.0716 15.0853Z"
              stroke={props.color}
              strokeWidth={stroke}
            />
          </G>
        </Svg>
      );
    case CustomIcons.Chat:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M13.0909 16.5459H26.9091"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M13.0909 23.4541H23.4546"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M28.6364 5.03832C26.0957 3.56867 23.1461 2.72754 20 2.72754C10.4606 2.72754 2.72729 10.4608 2.72729 20.0003C2.72729 22.7634 3.37609 25.3748 4.52963 27.6909C4.83619 28.3064 4.93822 29.0099 4.7605 29.674L3.73172 33.5191C3.28512 35.1882 4.81213 36.7151 6.48126 36.2686L10.3262 35.2398C10.9904 35.0621 11.6939 35.1642 12.3094 35.4706C14.6254 36.6242 17.2369 37.273 20 37.273C29.5394 37.273 37.2727 29.5396 37.2727 20.0003C37.2727 16.8542 36.4316 13.9045 34.962 11.3639"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );
    case CustomIcons.Account:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M20 16.6C23.866 16.6 27 13.5555 27 9.8C27 6.04446 23.866 3 20 3C16.134 3 13 6.04446 13 9.8C13 13.5555 16.134 16.6 20 16.6Z"
            stroke={props.color}
            strokeWidth={stroke}
          />
          <Path
            d="M33.9956 30.2002C34 29.9211 34 29.6375 34 29.3502C34 25.1252 27.732 21.7002 20 21.7002C12.268 21.7002 6 25.1252 6 29.3502C6 33.5752 6 37.0002 20 37.0002C23.9042 37.0002 26.7197 36.7338 28.75 36.258"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );
    case CustomIcons.Settings:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M19.9913 14.7769C17.1057 14.7769 14.7664 17.1162 14.7664 20.0018C14.7664 22.8873 17.1057 25.2267 19.9913 25.2267C22.8768 25.2267 25.2162 22.8873 25.2162 20.0018C25.2162 17.1162 22.8768 14.7769 19.9913 14.7769ZM14.6165 20.0018C14.6165 17.0333 17.0228 14.627 19.9913 14.627C22.9598 14.627 25.3661 17.0333 25.3661 20.0018C25.3661 22.9703 22.9598 25.3766 19.9913 25.3766C17.0228 25.3766 14.6165 22.9703 14.6165 20.0018Z"
            fill={props.color}
            stroke={props.color}
            strokeWidth={stroke}
          />
          <Path
            d="M16.8393 4.83434L16.8344 4.82582L16.8293 4.81738C16.0133 3.45786 14.2602 2.99089 12.9109 3.79306C12.9107 3.79322 12.9104 3.79338 12.9101 3.79354L12.9004 3.79933L9.85346 5.54273C9.85325 5.54285 9.85305 5.54296 9.85285 5.54308C8.66919 6.2198 8.07228 7.53505 8.23551 8.80785L8.09525 8.88914C7.89662 7.53945 8.51974 6.13247 9.77784 5.41326L9.77832 5.41298L12.8257 3.6691L12.8334 3.66472L12.841 3.66024C14.2692 2.81599 16.1111 3.32049 16.9624 4.74776L16.9664 4.75458L16.9683 4.75784L17.1574 5.08441L17.1589 5.08711L17.1591 5.08742C17.1594 5.0879 17.1597 5.08837 17.1599 5.08884C17.9526 6.4708 18.9852 7.12995 19.9934 7.12995C21.0021 7.12995 22.0395 6.47031 22.8409 5.08774L22.8412 5.08728L23.0395 4.74487C23.8915 3.31977 25.732 2.81654 27.1592 3.66023L27.1668 3.66472L27.1745 3.6691L30.2212 5.41258L30.2219 5.41296C31.8655 6.35217 32.4257 8.46512 31.4862 10.0911L31.4825 10.0976L31.4818 10.0988C30.6842 11.4788 30.6308 12.7021 31.1328 13.5736L31.1329 13.5737C31.6362 14.447 32.7242 15.0135 34.3186 15.0135C36.1973 15.0135 37.7501 16.5488 37.7501 18.445V21.5543C37.7501 23.4332 36.2149 24.9858 34.3186 24.9858C32.7243 24.9858 31.6362 25.5523 31.1329 26.4256L31.1328 26.4257C30.6298 27.2989 30.6844 28.5249 31.4862 29.9082L31.4864 29.9085C31.4868 29.9091 31.4871 29.9096 31.4874 29.9102C32.4252 31.5534 31.8649 33.6471 30.2223 34.5862L30.2219 34.5864L27.1744 36.3302L27.1667 36.3346L27.1591 36.3391C25.7311 37.1832 23.8896 36.679 23.0381 35.2521C23.0374 35.251 23.0367 35.2498 23.036 35.2486L23.0356 35.2479L23.0329 35.2432L22.8449 34.9184L22.842 34.9135L22.8413 34.9122L22.8411 34.9118C22.0484 33.5291 21.0154 32.8694 20.0067 32.8694C18.998 32.8694 17.9607 33.5292 17.1593 34.9116L17.1591 34.912L16.9608 35.2543C16.1088 36.6795 14.2684 37.1827 12.8411 36.3391L12.8335 36.3346L12.8259 36.3302L9.77902 34.5868L9.77854 34.5865C8.13511 33.647 7.57477 31.5339 8.51402 29.9082L8.51403 29.9082L8.51408 29.9081C8.51424 29.9078 8.51439 29.9076 8.51454 29.9073C9.3157 28.5246 9.37041 27.2987 8.86732 26.4256L8.8673 26.4256C8.36405 25.5523 7.27603 24.9858 5.68167 24.9858C3.7854 24.9858 2.25012 23.4332 2.25012 21.5543V18.445C2.25012 16.5663 3.78542 15.0135 5.68167 15.0135C7.27608 15.0135 8.36407 14.4469 8.8673 13.5737L8.86731 13.5737C9.37051 12.7004 9.31568 11.4742 8.51408 10.0912L8.51401 10.0911C8.51355 10.0903 8.5131 10.0895 8.51264 10.0887C8.39276 9.88086 8.29737 9.66505 8.22561 9.44478L9.06578 10.8966C9.46432 11.9544 9.4234 12.909 8.9972 13.6485L8.99719 13.6486C8.45548 14.5886 7.3016 15.1634 5.68167 15.1634C3.86919 15.1634 2.40005 16.6482 2.40005 18.445V21.5543C2.40005 23.3514 3.86925 24.8359 5.68167 24.8359C7.30157 24.8359 8.45547 25.4108 8.99719 26.3508L10.0802 25.7267L8.9972 26.3508C9.53884 27.2907 9.45822 28.5779 8.64407 29.9829L8.64297 29.9848C7.74597 31.5392 8.28237 33.5582 9.85204 34.4557C9.85226 34.4559 9.85249 34.456 9.85271 34.4561L12.9206 36.2119C14.2683 37.0059 16.0149 36.5385 16.8292 35.1821L16.8344 35.1736L16.8394 35.1649L17.0288 34.8375C17.8433 33.4324 18.9212 32.7194 20.0067 32.7194C21.092 32.7194 22.1648 33.4314 22.9702 34.8355L22.9739 34.8418L22.974 34.842L22.9753 34.8442L23.1608 35.1647L23.1658 35.1733L23.1709 35.1819C23.9871 36.5417 25.7406 37.0086 27.09 36.2059L27.0912 36.2052L27.1007 36.1996L30.1469 34.4566C30.1471 34.4565 30.1472 34.4564 30.1474 34.4563C31.7147 33.5602 32.2543 31.5608 31.359 29.9878L31.3591 29.9878L31.3545 29.9799C30.5419 28.576 30.4618 27.2901 31.0031 26.3508L31.0031 26.3508C31.5448 25.4107 32.6987 24.8359 34.3186 24.8359C36.1309 24.8359 37.6002 23.3514 37.6002 21.5543V18.445C37.6002 16.6326 36.1157 15.1634 34.3186 15.1634C32.6986 15.1634 31.5448 14.5886 31.0031 13.6486L31.0031 13.6485C30.4614 12.7087 30.542 11.4216 31.356 10.0168L31.357 10.015C32.2543 8.46061 31.718 6.4411 30.1482 5.54352C30.148 5.5434 30.1478 5.54328 30.1476 5.54316L27.0797 3.78754C25.7318 2.99334 23.9851 3.46094 23.1709 4.81736L23.1658 4.82596L23.1607 4.83464L22.9715 5.16173C22.9713 5.16193 22.9712 5.16213 22.9711 5.16234C22.9711 5.1624 22.971 5.16246 22.971 5.16252C22.1566 6.56716 21.0789 7.27988 19.9934 7.27988C18.9084 7.27988 17.8358 6.56808 17.0303 5.16431L17.0298 5.1635L17.0299 5.16349L17.0263 5.15733L16.8393 4.83434Z"
            fill={props.color}
            stroke={props.color}
            strokeWidth={stroke}
          />
        </Svg>
      );
    case CustomIcons.AddAccount:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M37 32.6667H24.25M30.625 26.3333V39M3 39C3 30.8384 9.65977 24.2222 17.875 24.2222C19.3519 24.2222 20.7784 24.4361 22.125 24.8342M26.375 9.44444C26.375 14.1082 22.5693 17.8889 17.875 17.8889C13.1806 17.8889 9.375 14.1082 9.375 9.44444C9.375 4.7807 13.1806 1 17.875 1C22.5693 1 26.375 4.7807 26.375 9.44444Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case CustomIcons.RightChevron:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.71596 38.3044C10.6706 39.2319 12.2183 39.2319 13.1729 38.3044L30.2841 21.6793C31.2386 20.7519 31.2386 19.248 30.2841 18.3206L13.1729 1.69558C12.2183 0.768143 10.6706 0.768143 9.71596 1.69558C8.76135 2.62302 8.76135 4.12687 9.71596 5.05431L25.0987 20L9.71596 34.9456C8.76135 35.8731 8.76135 37.3769 9.71596 38.3044Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.LeftArrow:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M3.27016 18.251H38.2509C38.7148 18.251 39.1596 18.4352 39.4877 18.7633C39.8157 19.0913 39.9999 19.5361 39.9999 20C39.9999 20.4639 39.8157 20.9088 39.4877 21.2368C39.1596 21.5648 38.7148 21.7491 38.2509 21.7491H3.27016C2.80628 21.7491 2.36141 21.5648 2.0334 21.2368C1.70539 20.9088 1.52112 20.4639 1.52112 20C1.52112 19.5361 1.70539 19.0913 2.0334 18.7633C2.36141 18.4352 2.80628 18.251 3.27016 18.251Z"
            fill={props.color}
          />
          <Path
            d="M4.2253 19.9994L18.7318 34.5024C19.0602 34.8309 19.2447 35.2763 19.2447 35.7407C19.2447 36.2052 19.0602 36.6506 18.7318 36.9791C18.4034 37.3075 17.958 37.492 17.4935 37.492C17.029 37.492 16.5836 37.3075 16.2552 36.9791L0.513845 21.2377C0.350964 21.0753 0.221735 20.8823 0.133561 20.6698C0.045387 20.4573 0 20.2295 0 19.9994C0 19.7694 0.045387 19.5416 0.133561 19.3291C0.221735 19.1166 0.350964 18.9236 0.513845 18.7611L16.2552 3.01976C16.5836 2.69134 17.029 2.50684 17.4935 2.50684C17.958 2.50684 18.4034 2.69134 18.7318 3.01976C19.0602 3.34819 19.2447 3.79362 19.2447 4.25808C19.2447 4.72254 19.0602 5.16798 18.7318 5.4964L4.2253 19.9994Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.AddSquareRounded:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M2 20C2 11.5147 2 7.27207 4.63605 4.63605C7.27207 2 11.5147 2 20 2C28.4852 2 32.728 2 35.3639 4.63605C38 7.27207 38 11.5147 38 20C38 28.4852 38 32.728 35.3639 35.3639C32.728 38 28.4852 38 20 38C11.5147 38 7.27207 38 4.63605 35.3639C2 32.728 2 28.4852 2 20Z"
            stroke={props.color}
            strokeWidth={stroke}
          />
          <Path
            d="M25.4001 20.0006H20.0001M20.0001 20.0006H14.6001M20.0001 20.0006V14.6006M20.0001 20.0006V25.4006"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );
    case CustomIcons.Search:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M17.8889 7.33333C23.7185 7.33333 28.4444 12.0592 28.4444 17.8889M29.8352 29.827L39 39M34.7778 17.8889C34.7778 27.2164 27.2164 34.7778 17.8889 34.7778C8.56141 34.7778 1 27.2164 1 17.8889C1 8.56141 8.56141 1 17.8889 1C27.2164 1 34.7778 8.56141 34.7778 17.8889Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case CustomIcons.Dot:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Circle cx="20" cy="20" r="5" fill={props.color} />
        </Svg>
      );
    case CustomIcons.Circle:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Circle cx="20" cy="20" r="20" fill={props.color} />
        </Svg>
      );
    case CustomIcons.Logout:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M25.6667 20.0014H8.66675M8.66675 20.0014L12.4445 23.7792M8.66675 20.0014L12.4445 16.2236"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M20.0001 38.8574C17.0657 38.769 15.3155 38.4417 14.1042 37.2303C12.6528 35.7789 12.4706 33.554 12.4478 29.4456M27.5556 38.8869C31.664 38.864 33.8889 38.6817 35.3403 37.2303C37.0001 35.5705 37.0001 32.8993 37.0001 27.5567V23.779V16.2234V12.4456C37.0001 7.10305 37.0001 4.43176 35.3403 2.77203C33.6805 1.1123 31.0093 1.1123 25.6667 1.1123H23.7779C18.4351 1.1123 15.7639 1.1123 14.1042 2.77203C12.6528 4.22342 12.4706 6.44836 12.4478 10.5567"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M3 15.2794V24.7239C3 29.176 3 31.402 4.3831 32.7852C5.76622 34.1683 7.9923 34.1683 12.4444 34.1683M4.3831 7.21806C5.76622 5.83496 7.9923 5.83496 12.4444 5.83496"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );
    case CustomIcons.Shop:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M15.4448 37.3106V31.8443C15.4448 30.1414 15.4448 29.2899 15.811 28.6556C16.0509 28.2402 16.396 27.8951 16.8114 27.6553C17.4457 27.2891 18.2971 27.2891 20.0001 27.2891C21.703 27.2891 22.5545 27.2891 23.1887 27.6553C23.6042 27.8951 23.9493 28.2402 24.1891 28.6556C24.5553 29.2899 24.5553 30.1414 24.5553 31.8443V37.3106"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M36.3991 38.2207H14.5339M3.60132 38.2207H8.15656"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M32.7549 38.2215V25.4668"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M7.24536 38.2215V25.4668"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M19.9999 1.7793H11.7499C9.55824 1.7793 8.46241 1.7793 7.58179 2.32356C6.70115 2.86782 6.21108 3.84794 5.23096 5.80821L2.67342 12.2733C2.08254 13.767 1.56555 15.5275 2.5602 16.7888C3.22749 17.635 4.26186 18.1782 5.42315 18.1782C7.43578 18.1782 9.06734 16.5467 9.06734 14.534C9.06734 16.5467 10.6989 18.1782 12.7115 18.1782C14.7242 18.1782 16.3557 16.5467 16.3557 14.534C16.3557 16.5467 17.9872 18.1782 19.9999 18.1782C22.0126 18.1782 23.6441 16.5467 23.6441 14.534C23.6441 16.5467 25.2756 18.1782 27.2883 18.1782C29.301 18.1782 30.9325 16.5467 30.9325 14.534C30.9325 16.5467 32.564 18.1782 34.5767 18.1782C35.7381 18.1782 36.7725 17.635 37.4398 16.7888C38.4344 15.5275 37.9175 13.767 37.3266 12.2733L34.7691 5.80821C33.789 3.84794 33.2989 2.86782 32.4182 2.32356C31.5376 1.7793 30.4418 1.7793 28.2502 1.7793H27.2885"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case CustomIcons.DoubleTick:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M3.78014 18.772C3.14415 18.0937 2.11298 18.0937 1.47699 18.772C0.841002 19.4503 0.841002 20.5498 1.47699 21.2281L3.78014 18.772ZM11.3143 29.2632L10.1627 30.4913C10.7987 31.1696 11.8299 31.1696 12.4659 30.4913L11.3143 29.2632ZM29.8373 11.965C30.4733 11.2867 30.4733 10.187 29.8373 9.50871C29.2012 8.83043 28.1703 8.83043 27.5342 9.50871L29.8373 11.965ZM12.4659 18.772C11.8299 18.0937 10.7987 18.0937 10.1627 18.772C9.52673 19.4503 9.52673 20.5498 10.1627 21.2281L12.4659 18.772ZM20 29.2632L18.8485 30.4913C19.4845 31.1696 20.5155 31.1696 21.1515 30.4913L20 29.2632ZM38.523 11.965C39.159 11.2867 39.159 10.187 38.523 9.50871C37.887 8.83043 36.856 8.83043 36.22 9.50871L38.523 11.965ZM1.47699 21.2281L10.1627 30.4913L12.4659 28.0351L3.78014 18.772L1.47699 21.2281ZM12.4659 30.4913L29.8373 11.965L27.5342 9.50871L10.1627 28.0351L12.4659 30.4913ZM10.1627 21.2281L18.8485 30.4913L21.1515 28.0351L12.4659 18.772L10.1627 21.2281ZM21.1515 30.4913L38.523 11.965L36.22 9.50871L18.8485 28.0351L21.1515 30.4913Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.SingleTick:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M5.41421 18.5487C4.63317 17.7471 3.36682 17.7471 2.58578 18.5487C1.80474 19.3503 1.80474 20.6498 2.58578 21.4514L5.41421 18.5487ZM14.6667 30.9474L13.2525 32.3988C14.0335 33.2004 15.2999 33.2004 16.0809 32.3988L14.6667 30.9474ZM37.4142 10.5041C38.1953 9.70247 38.1953 8.40279 37.4142 7.6012C36.6331 6.7996 35.367 6.7996 34.5859 7.6012L37.4142 10.5041ZM2.58578 21.4514L13.2525 32.3988L16.0809 29.4961L5.41421 18.5487L2.58578 21.4514ZM16.0809 32.3988L37.4142 10.5041L34.5859 7.6012L13.2525 29.4961L16.0809 32.3988Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.Camera:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M20 27.1994C22.9823 27.1994 25.4 24.7818 25.4 21.7994C25.4 18.8171 22.9823 16.3994 20 16.3994C17.0176 16.3994 14.6 18.8171 14.6 21.7994C14.6 24.7818 17.0176 27.1994 20 27.1994Z"
            stroke={props.color}
            strokeWidth={stroke}
          />
          <Path
            d="M1.99988 22.4543C1.99988 16.9388 1.99988 14.1808 3.34812 12.1997C3.93179 11.3421 4.68179 10.6057 5.55532 10.0326C6.85188 9.18205 8.47509 8.87803 10.9603 8.76936C12.1462 8.76936 13.1673 7.88704 13.3999 6.74526C13.7488 5.03261 15.2804 3.7998 17.0593 3.7998H22.9406C24.7194 3.7998 26.251 5.03261 26.6 6.74526C26.8326 7.88704 27.8535 8.76936 29.0395 8.76936C31.5248 8.87803 33.1479 9.18205 34.4446 10.0326C35.318 10.6057 36.068 11.3421 36.6518 12.1997C38 14.1808 38 16.9388 38 22.4543C38 27.9701 38 30.728 36.6518 32.7091C36.068 33.5667 35.318 34.303 34.4446 34.8762C32.4268 36.1999 29.6179 36.1999 23.9999 36.1999H15.9999C10.382 36.1999 7.57312 36.1999 5.55532 34.8762C4.68179 34.303 3.93179 33.5667 3.34812 32.7091C2.96731 32.1495 2.69407 31.528 2.49799 30.7999"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M32.6001 16.3994H30.8"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );
    case CustomIcons.Post:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M8.06401 7.9192C4.688 9.6072 3 10.4512 3 11.5C3 12.5488 4.688 13.3928 8.06401 15.0808L12.8384 17.4681C16.2144 19.156 17.9024 20 20 20C22.0976 20 23.7856 19.156 27.1616 17.4681L31.936 15.0808C35.3121 13.3928 37 12.5488 37 11.5C37 10.4512 35.3121 9.6072 31.936 7.9192L27.1616 5.532C23.7856 3.84401 22.0976 3 20 3C18.3784 3 17.0014 3.50448 14.9 4.51345"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M9.40242 15.75L8.06401 16.4192C4.688 18.1073 3 18.9513 3 20C3 21.0487 4.688 21.8927 8.06401 23.5808L12.8384 25.9681C16.2144 27.656 17.9024 28.5 20 28.5C22.0976 28.5 23.7856 27.656 27.1616 25.9681L31.936 23.5808C35.3121 21.8927 37 21.0487 37 20C37 18.9513 35.3121 18.1073 31.936 16.4192L30.5976 15.75"
            stroke={props.color}
            strokeWidth={stroke}
          />
          <Path
            d="M31.936 32.0808C35.3121 30.3927 37 29.5487 37 28.5C37 27.4513 35.3121 26.6073 31.936 24.9192L30.5976 24.25M9.40242 24.25L8.06401 24.9192C4.688 26.6073 3 27.4513 3 28.5C3 29.5487 4.688 30.3927 8.06401 32.0808L12.8384 34.4681C16.2144 36.156 17.9024 37 20 37C21.6216 37 22.9986 36.4955 25.1 35.4866"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );
    case CustomIcons.Camera2:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M24.3388 16.2748C24.0634 16.2748 23.8228 16.0903 23.7514 15.8242L23.3416 14.3041C23.2702 14.0389 23.0288 13.8535 22.7541 13.8535H20.9297H18.7669H16.9416C16.6661 13.8535 16.4256 14.038 16.3541 14.3041L15.9444 15.8242C15.8729 16.0894 15.6315 16.2748 15.3569 16.2748H12.5803C12.2436 16.2748 11.9716 16.5477 11.9716 16.8835V25.5364C11.9716 25.8731 12.2445 26.1451 12.5803 26.1451H27.1138C27.4504 26.1451 27.7225 25.8722 27.7225 25.5364V16.8843C27.7225 16.5477 27.4496 16.2756 27.1138 16.2756H24.3388V16.2748ZM22.1726 20.7602C22.0995 21.9198 21.1584 22.861 19.9979 22.9349C18.5918 23.0242 17.4321 21.8646 17.5206 20.4576C17.5937 19.2979 18.5348 18.3568 19.6953 18.2829C21.1023 18.1944 22.2619 19.3541 22.1726 20.7602Z"
            fill={props.color}
          />
          <Path
            d="M5.22262 21.3953C5.54739 21.3953 5.8628 21.2652 6.09234 21.0356L7.89723 19.2307C8.30021 18.8278 8.44133 18.2174 8.21434 17.6954C7.98225 17.1606 7.4594 16.9345 6.61264 17.0518L6.58968 17.0747C7.93124 10.991 13.3655 6.42477 19.8471 6.42477C25.0093 6.42477 29.6588 9.29152 31.9814 13.9053C32.2858 14.5098 33.022 14.7529 33.6257 14.4486C34.2301 14.1442 34.4733 13.408 34.1689 12.8044C32.8537 10.1918 30.849 7.98737 28.3691 6.42732C25.8203 4.82222 22.8737 3.97461 19.8479 3.97461C11.9414 3.97461 5.3544 9.73105 4.0562 17.272C3.59882 16.8665 2.90084 16.8316 2.42985 17.2346C1.89425 17.6928 1.85599 18.4996 2.33378 19.0063C2.35333 19.0267 2.81752 19.519 3.30381 20.0205C3.59372 20.319 3.83091 20.5587 4.00945 20.733C4.36906 21.0841 4.67937 21.3868 5.20562 21.3944C5.21072 21.3953 5.21667 21.3953 5.22262 21.3953Z"
            fill={props.color}
          />
          <Path
            d="M37.6414 19.3051L35.3884 17.0522C35.1546 16.8184 34.8299 16.6866 34.5009 16.6926C34.3028 16.6951 34.1361 16.7402 33.9848 16.8133C33.9627 16.8235 33.9415 16.8354 33.9202 16.8473C33.9168 16.849 33.9134 16.8507 33.91 16.8524C33.8598 16.8805 33.8114 16.9102 33.7663 16.9442C33.6065 17.0581 33.4603 17.2018 33.3038 17.354C33.1253 17.5283 32.8881 17.768 32.5982 18.0664C32.1119 18.568 31.6477 19.0594 31.6282 19.0807C31.164 19.5729 31.1869 20.3483 31.6792 20.8116C32.168 21.2724 32.9349 21.252 33.3999 20.7708C32.9986 27.8994 27.073 33.5759 19.8458 33.5759C13.8505 33.5759 8.63557 29.7306 6.87063 24.0074C6.67085 23.3612 5.98562 22.9991 5.33949 23.198C4.69337 23.3969 4.3312 24.083 4.53014 24.7291C5.51803 27.9326 7.54651 30.8095 10.2424 32.8295C13.0309 34.92 16.3516 36.0244 19.8458 36.0244C28.3568 36.0244 35.3383 29.3549 35.8407 20.968L35.9079 21.0352C36.1468 21.2741 36.4605 21.394 36.7733 21.394C37.0871 21.394 37.3999 21.2741 37.6388 21.0352C38.12 20.5591 38.12 19.7838 37.6414 19.3051Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.Expand:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 42 42"
          fill="none">
          <Path
            d="M1 11.9092V1H11.9091"
            stroke={props.color}
            strokeWidth={stroke}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M40.9999 11.9092V1H30.0908"
            stroke={props.color}
            strokeWidth={stroke}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M40.9999 30.0908V41H30.0908"
            stroke={props.color}
            strokeWidth={stroke}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M1 30.0908V41H11.9091"
            stroke={props.color}
            strokeWidth={stroke}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M1 41.0002L15 27"
            stroke={props.color}
            strokeWidth={stroke}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M27 15.0002L41 1"
            stroke={props.color}
            strokeWidth={stroke}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M41 41.0002L27 27"
            stroke={props.color}
            strokeWidth={stroke}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M15 15.0002L1 1"
            stroke={props.color}
            strokeWidth={stroke}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case CustomIcons.Share:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M14.4999 20.0003C14.4999 22.921 12.0375 25.2887 8.99995 25.2887C5.96242 25.2887 3.5 22.921 3.5 20.0003C3.5 17.0796 5.96242 14.7119 8.99995 14.7119C12.0375 14.7119 14.4999 17.0796 14.4999 20.0003Z"
            stroke={props.color}
            strokeWidth={stroke}
          />
          <Path
            d="M25.4999 8.36523L13 16"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M25 32L14 24"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M36.4999 33.7503C36.4999 36.671 34.0375 39.0387 31 39.0387C27.9624 39.0387 25.5 36.671 25.5 33.7503C25.5 30.8296 27.9624 28.4619 31 28.4619C34.0375 28.4619 36.4999 30.8296 36.4999 33.7503Z"
            stroke={props.color}
            strokeWidth={stroke}
          />
          <Path
            d="M36.4999 6.24935C36.4999 9.17006 34.0375 11.5378 31 11.5378C27.9624 11.5378 25.5 9.17006 25.5 6.24935C25.5 3.32865 27.9624 0.960938 31 0.960938C34.0375 0.960938 36.4999 3.32865 36.4999 6.24935Z"
            stroke={props.color}
            strokeWidth={stroke}
          />
        </Svg>
      );
    case CustomIcons.Like:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 42 42"
          fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M21 5.93144C17.0013 0.678557 10.3195 -0.94481 5.3094 3.86525C0.299287 8.67531 -0.406068 16.7174 3.5284 22.4064C6.79965 27.1362 16.6996 37.112 19.9442 40.3409C20.3071 40.7021 20.4887 40.8827 20.7005 40.9536C20.8851 41.0155 21.0874 41.0155 21.2722 40.9536C21.484 40.8827 21.6654 40.7021 22.0285 40.3409C25.2731 37.112 35.1729 27.1362 38.4443 22.4064C42.3787 16.7174 41.7594 8.62471 36.6631 3.86525C31.5669 -0.894211 24.9987 0.678557 21 5.93144Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case CustomIcons.Plus:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M20 40C31.0456 40 40 31.0456 40 20C40 8.9543 31.0456 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0456 8.9543 40 20 40ZM21.5 14C21.5 13.1716 20.8284 12.5 20 12.5C19.1716 12.5 18.5 13.1716 18.5 14V18.5H14C13.1716 18.5 12.5 19.1716 12.5 20C12.5 20.8284 13.1716 21.5 14 21.5H18.5V26C18.5 26.8284 19.1716 27.5 20 27.5C20.8284 27.5 21.5 26.8284 21.5 26V21.5H26C26.8284 21.5 27.5 20.8284 27.5 20C27.5 19.1716 26.8284 18.5 26 18.5H21.5V14Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.Minus:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M40 20C40 31.0456 31.0456 40 20 40C8.9543 40 0 31.0456 0 20C0 8.9543 8.9543 0 20 0C31.0456 0 40 8.9543 40 20ZM27.5 20C27.5 20.8284 26.8284 21.5 26 21.5H14C13.1716 21.5 12.5 20.8284 12.5 20C12.5 19.1716 13.1716 18.5 14 18.5H26C26.8284 18.5 27.5 19.1716 27.5 20Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.AddImage:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 44 44"
          fill="none">
          <Path
            d="M2 23.0002L5.50318 19.935C7.32572 18.3404 10.0726 18.4318 11.785 20.1442L20.3644 28.7236C21.7388 30.0982 23.9024 30.2856 25.4928 29.1678L26.0892 28.7488C28.3776 27.1404 31.4738 27.3268 33.553 29.198L40 35.0002"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M28 9H35M35 9H42M35 9V16M35 9V2"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M42 22C42 31.428 42 36.1422 39.071 39.071C36.1422 42 31.428 42 22 42C12.5719 42 7.85786 42 4.92894 39.071C2 36.1422 2 31.428 2 22C2 19.7434 2 17.7567 2.04016 16M22 2C12.5719 2 7.85786 2 4.92894 4.92894C4.0793 5.77858 3.47612 6.77842 3.04792 8"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );
    case CustomIcons.Send:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M39.9999 20L1.17706 0.513936L7.64635 20.0468L1.43029 39.1222L39.9999 20Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.CheckBox:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M28.3941 0H11.6258C4.34216 0 0 4.34 0 11.62V28.36C0 35.66 4.34216 40 11.6258 40H28.3741C35.6578 40 39.9999 35.66 39.9999 28.38V11.62C40.0199 4.34 35.6778 0 28.3941 0ZM29.5747 15.4L18.2291 26.74C17.9489 27.02 17.5688 27.18 17.1686 27.18C16.7684 27.18 16.3882 27.02 16.108 26.74L10.4452 21.08C9.86492 20.5 9.86492 19.54 10.4452 18.96C11.0255 18.38 11.986 18.38 12.5663 18.96L17.1686 23.56L27.4537 13.28C28.034 12.7 28.9944 12.7 29.5747 13.28C30.155 13.86 30.155 14.8 29.5747 15.4Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.Bell:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M15.1791 4.11035C16.6402 3.39837 18.2748 3 20 3C26.2123 3 31.2485 8.16555 31.2485 14.5376V15.6981C31.2485 17.0909 31.6505 18.4524 32.4037 19.6112L34.2493 22.4509C35.9353 25.0447 34.6483 28.5704 31.716 29.3907C24.0455 31.5364 15.9546 31.5364 8.28393 29.3907C5.35175 28.5704 4.0647 25.0447 5.7506 22.4509L7.59633 19.6112C8.34953 18.4524 8.75145 17.0909 8.75145 15.6981V14.5376C8.75145 12.768 9.13985 11.0915 9.83398 9.5928"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M12.2727 31C13.3975 33.913 16.4325 36 20 36C20.4198 36 20.8323 35.9712 21.235 35.9153M27.7273 31C27.2686 32.1877 26.4926 33.238 25.4924 34.0655"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );
    case CustomIcons.Cart:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M14.2315 29.667C15.5662 29.667 16.6482 30.749 16.6482 32.0837C16.6482 33.4183 15.5662 34.5003 14.2315 34.5003C12.8968 34.5003 11.8148 33.4183 11.8148 32.0837C11.8148 30.749 12.8968 29.667 14.2315 29.667Z"
            stroke={props.color}
            strokeWidth={stroke}
          />
          <Path
            d="M28.7315 29.667C30.0661 29.667 31.1482 30.7489 31.1482 32.0837C31.1482 33.4183 30.0661 34.5003 28.7315 34.5003C27.3968 34.5003 26.3148 33.4183 26.3148 32.0837C26.3148 30.7489 27.3968 29.667 28.7315 29.667Z"
            stroke={props.color}
            strokeWidth={stroke}
          />
          <Path
            d="M19.8704 15.167H15.0371"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M5.37036 5.5L5.79716 5.64226C7.92389 6.35118 8.98726 6.70563 9.59547 7.54949C10.2037 8.39335 10.2037 9.51423 10.2037 11.756V15.9722C10.2037 20.5291 10.2037 22.8075 11.6193 24.2232C13.035 25.6389 15.3134 25.6389 19.8704 25.6389H23.0926M32.7593 25.6389H29.537"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M10.2036 10.333H15.0369M11.0092 21.6108H27.961C29.5067 21.6108 30.2795 21.6108 30.8848 21.2117C31.4901 20.8125 31.7946 20.1021 32.4034 18.6815L33.094 17.0704C34.3982 14.0272 35.0503 12.5056 34.334 11.4193C33.6176 10.333 31.9623 10.333 28.6515 10.333H21.4814"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );
    case CustomIcons.Bell:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M15.1791 4.11035C16.6402 3.39837 18.2748 3 20 3C26.2123 3 31.2485 8.16555 31.2485 14.5376V15.6981C31.2485 17.0909 31.6505 18.4524 32.4037 19.6112L34.2493 22.4509C35.9353 25.0447 34.6483 28.5704 31.716 29.3907C24.0455 31.5364 15.9546 31.5364 8.28393 29.3907C5.35175 28.5704 4.0647 25.0447 5.7506 22.4509L7.59633 19.6112C8.34953 18.4524 8.75145 17.0909 8.75145 15.6981V14.5376C8.75145 12.768 9.13985 11.0915 9.83398 9.5928"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M12.2727 31C13.3975 33.913 16.4325 36 20 36C20.4198 36 20.8323 35.9712 21.235 35.9153M27.7273 31C27.2686 32.1877 26.4926 33.238 25.4924 34.0655"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );
    case CustomIcons.Cart:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M14.2315 29.667C15.5662 29.667 16.6482 30.749 16.6482 32.0837C16.6482 33.4183 15.5662 34.5003 14.2315 34.5003C12.8968 34.5003 11.8148 33.4183 11.8148 32.0837C11.8148 30.749 12.8968 29.667 14.2315 29.667Z"
            stroke={props.color}
            strokeWidth={stroke}
          />
          <Path
            d="M28.7315 29.667C30.0661 29.667 31.1482 30.7489 31.1482 32.0837C31.1482 33.4183 30.0661 34.5003 28.7315 34.5003C27.3968 34.5003 26.3148 33.4183 26.3148 32.0837C26.3148 30.7489 27.3968 29.667 28.7315 29.667Z"
            stroke={props.color}
            strokeWidth={stroke}
          />
          <Path
            d="M19.8704 15.167H15.0371"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M5.37036 5.5L5.79716 5.64226C7.92389 6.35118 8.98726 6.70563 9.59547 7.54949C10.2037 8.39335 10.2037 9.51423 10.2037 11.756V15.9722C10.2037 20.5291 10.2037 22.8075 11.6193 24.2232C13.035 25.6389 15.3134 25.6389 19.8704 25.6389H23.0926M32.7593 25.6389H29.537"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="M10.2036 10.333H15.0369M11.0092 21.6108H27.961C29.5067 21.6108 30.2795 21.6108 30.8848 21.2117C31.4901 20.8125 31.7946 20.1021 32.4034 18.6815L33.094 17.0704C34.3982 14.0272 35.0503 12.5056 34.334 11.4193C33.6176 10.333 31.9623 10.333 28.6515 10.333H21.4814"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );
    case CustomIcons.RadioUnchecked:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Circle
            cx="20"
            cy="20"
            r="13"
            stroke={props.color}
            strokeWidth={stroke}
          />
        </Svg>
      );
    case CustomIcons.RadioChecked:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Circle cx="20" cy="20" r="14.5" stroke={props.color} />
          <Circle cx="20" cy="20" r="9" fill={props.color} />
        </Svg>
      );
    case CustomIcons.Edit:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M35.4665 10.6668L19.5665 26.5667C17.9832 28.1501 13.2831 28.8834 12.2331 27.8334C11.1831 26.7834 11.8998 22.0834 13.4831 20.5001L29.3998 4.58345C29.7923 4.15522 30.2675 3.81098 30.7968 3.57148C31.326 3.33198 31.8983 3.20215 32.4792 3.18992C33.0598 3.1777 33.6372 3.28327 34.176 3.50028C34.7148 3.7173 35.2042 4.0413 35.6143 4.45263C36.0245 4.86397 36.3472 5.35413 36.5627 5.89357C36.7782 6.43302 36.8823 7.01052 36.8685 7.59127C36.8547 8.17202 36.7232 8.744 36.4823 9.27258C36.2413 9.80117 35.8958 10.2755 35.4665 10.6668Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M18.3334 6.6665H10C8.23192 6.6665 6.53634 7.36887 5.28609 8.61912C4.03586 9.86937 3.33337 11.5651 3.33337 13.3332V29.9998C3.33337 31.768 4.03586 33.4637 5.28609 34.7138C6.53634 35.9642 8.23192 36.6665 10 36.6665H28.3334C32.0167 36.6665 33.3334 33.6665 33.3334 29.9998V21.6665"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case CustomIcons.Eye:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M39.6956 19.0434C39.3913 18.6086 32.3478 8.26074 20 8.26074C7.65217 8.26074 0.60869 18.6086 0.304343 19.0434C-0.0869618 19.6086 -0.0869618 20.3912 0.304343 20.9999C0.60869 21.3912 7.65217 31.739 20 31.739C32.3478 31.739 39.3913 21.3912 39.6956 20.9564C40.087 20.3912 40.087 19.6086 39.6956 19.0434ZM20 28.2607C11.6087 28.2607 5.86956 22.3477 3.91304 19.9999C5.86956 17.6086 11.5652 11.739 20 11.739C28.3913 11.739 34.1304 17.652 36.087 19.9999C34.087 22.3912 28.3913 28.2607 20 28.2607ZM21 12.8694C19.087 12.6086 17.2174 13.0868 15.6522 14.2607C12.4783 16.652 11.8261 21.1738 14.2174 24.3477C15.3913 25.9129 17.0435 26.8694 18.9565 27.1738C19.3043 27.2173 19.6522 27.2607 19.9565 27.2607C21.5217 27.2607 23 26.739 24.2609 25.826C27.4348 23.4347 28.087 18.9129 25.6956 15.739C24.6087 14.1303 22.913 13.1303 21 12.8694ZM22.7391 23.6955C21.7826 24.4347 20.5652 24.739 19.3478 24.5651C18.1304 24.3912 17.0435 23.739 16.3043 22.7825C14.8261 20.739 15.2174 17.826 17.2609 16.3042C18.2174 15.5651 19.4348 15.2607 20.6522 15.4347C21.8696 15.6086 22.9565 16.2607 23.6956 17.2173C25.1739 19.2607 24.7826 22.1738 22.7391 23.6955ZM22.5652 17.3912C22.913 17.6955 23.087 18.1738 23.087 18.6086C23.087 19.0434 22.913 19.5216 22.5652 19.826C22.2609 20.1303 21.7826 20.3477 21.3478 20.3477C20.8696 20.3477 20.4348 20.1738 20.1304 19.826C19.7826 19.4781 19.6087 19.0434 19.6087 18.6086C19.6087 18.1303 19.7826 17.6955 20.1304 17.3912C20.4348 17.0434 20.913 16.8694 21.3478 16.8694C21.8261 16.9129 22.2609 17.0868 22.5652 17.3912Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.UpChevron:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M38.3044 30.284C39.2319 29.3294 39.2319 27.7817 38.3044 26.8271L21.6793 9.71592C20.7519 8.76136 19.248 8.76136 18.3206 9.71592L1.69558 26.8271C0.768143 27.7817 0.768143 29.3294 1.69558 30.284C2.62302 31.2387 4.12687 31.2387 5.05431 30.284L20 14.9013L34.9456 30.284C35.8731 31.2387 37.3769 31.2387 38.3044 30.284Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.CloseCircle:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M36.6667 20.0002C36.6667 29.2048 29.2047 36.6668 20 36.6668C10.7953 36.6668 3.33337 29.2048 3.33337 20.0002C3.33337 10.7954 10.7953 3.3335 20 3.3335C29.2047 3.3335 36.6667 10.7954 36.6667 20.0002ZM14.9494 14.9496C15.4376 14.4614 16.229 14.4614 16.7172 14.9496L20 18.2323L23.2827 14.9496C23.7709 14.4615 24.5624 14.4615 25.0505 14.9496C25.5387 15.4378 25.5387 16.2292 25.0505 16.7173L21.7677 20.0002L25.0505 23.2828C25.5387 23.771 25.5387 24.5625 25.0505 25.0507C24.5624 25.5388 23.7709 25.5388 23.2827 25.0507L20 21.768L16.7172 25.0507C16.2291 25.5388 15.4376 25.5388 14.9495 25.0507C14.4613 24.5625 14.4613 23.771 14.9495 23.283L18.2322 20.0002L14.9494 16.7173C14.4613 16.2292 14.4613 15.4377 14.9494 14.9496Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.Close:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M7.62503 7.62503C8.09385 7.15635 8.72962 6.89307 9.39253 6.89307C10.0554 6.89307 10.6912 7.15635 11.16 7.62503L20 16.465L28.84 7.62503C29.3115 7.16964 29.943 6.91765 30.5985 6.92335C31.254 6.92904 31.8811 7.19197 32.3446 7.65549C32.8081 8.11901 33.071 8.74604 33.0767 9.40153C33.0824 10.057 32.8304 10.6885 32.375 11.16L23.535 20L32.375 28.84C32.8304 29.3115 33.0824 29.943 33.0767 30.5985C33.071 31.254 32.8081 31.8811 32.3446 32.3446C31.8811 32.8081 31.254 33.071 30.5985 33.0767C29.943 33.0824 29.3115 32.8304 28.84 32.375L20 23.535L11.16 32.375C10.6885 32.8304 10.057 33.0824 9.40153 33.0767C8.74604 33.071 8.11901 32.8081 7.65549 32.3446C7.19197 31.8811 6.92904 31.254 6.92335 30.5985C6.91765 29.943 7.16964 29.3115 7.62503 28.84L16.465 20L7.62503 11.16C7.15635 10.6912 6.89307 10.0554 6.89307 9.39253C6.89307 8.72962 7.15635 8.09385 7.62503 7.62503Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.Menu:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M20 28.3333C21.841 28.3333 23.3333 29.8257 23.3333 31.6667C23.3333 33.5076 21.841 35 20 35C18.159 35 16.6666 33.5076 16.6666 31.6667C16.6666 29.8257 18.159 28.3333 20 28.3333Z"
            fill={props.color}
          />
          <Path
            d="M20 4.99984C21.841 4.99984 23.3333 6.49217 23.3333 8.33317C23.3333 10.1742 21.841 11.6665 20 11.6665C18.159 11.6665 16.6666 10.1742 16.6666 8.33317C16.6666 6.49217 18.159 4.99984 20 4.99984Z"
            fill={props.color}
          />
          <Path
            d="M20 16.6668C21.841 16.6668 23.3333 18.1592 23.3333 20.0002C23.3333 21.8412 21.841 23.3335 20 23.3335C18.159 23.3335 16.6666 21.8412 16.6666 20.0002C16.6666 18.1592 18.159 16.6668 20 16.6668Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.Delete:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M16.6666 20V28.3333"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M23.3334 20V28.3333"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M7 12H33.6667"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 17V30.3333C10 33.0948 12.2386 35.3333 15 35.3333H25C27.7615 35.3333 30 33.0948 30 30.3333V17"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M15 8.33333C15 6.49238 16.4924 5 18.3333 5H21.6667C23.5077 5 25 6.49238 25 8.33333V11.6667H15V8.33333Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case CustomIcons.FazharLogo:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 512 512"
          fill="none">
          <Path
            d="M242.757 108.514L237.181 144.811H376.2L372.216 168.743C372.216 168.743 369.311 174.33 366.241 176.72C362.474 179.654 354.69 180.709 354.69 180.709H227.621L205.314 292.392H310.474L306.889 314.728C306.889 314.728 303.064 322.886 298.524 325.896C292.265 330.047 279.404 327.891 279.404 327.891H198.941L177.829 429.203C177.829 429.203 170.964 445.585 162.294 451.938C153.876 458.106 136.8 459.915 136.8 459.915L214.077 69.8242H231.604L205.712 8L157.115 69.8242H175.04L89 501.397C89 501.397 120.644 505.003 140.385 501.397C155.533 498.631 164.621 496.957 177.829 489.033C194.731 478.891 201.633 468.664 212.086 451.938C230.382 422.663 232.002 365.783 232.002 365.783C232.002 365.783 270.683 372.001 294.143 365.783C307.214 362.318 315.738 361.028 326.01 352.221C334.761 344.719 342.74 327.891 342.74 327.891L357.478 254.499H252.317L258.293 219H357.478C357.478 219 380.473 216.229 391.337 207.433C399.928 200.477 407.668 184.299 407.668 184.299L424 108.514H242.757Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.QRCode:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M16.1447 10.5205C16.1447 9.41594 15.2492 8.52051 14.1447 8.52051H10.6447C9.54008 8.52051 8.64465 9.41594 8.64465 10.5205V14.0205C8.64465 15.1251 9.54008 16.0205 10.6447 16.0205H14.1447C15.2492 16.0205 16.1447 15.1251 16.1447 14.0205V10.5205ZM8.14465 6.02051C7.04008 6.02051 6.14465 6.91594 6.14465 8.02051V16.5205C6.14465 17.6251 7.04008 18.5205 8.14465 18.5205H16.6447C17.7492 18.5205 18.6447 17.6251 18.6447 16.5205V8.02051C18.6447 6.91594 17.7492 6.02051 16.6447 6.02051H8.14465ZM16.1447 25.5205C16.1447 24.4159 15.2492 23.5205 14.1447 23.5205H10.6447C9.54008 23.5205 8.64465 24.4159 8.64465 25.5205V29.0205C8.64465 30.1251 9.54008 31.0205 10.6447 31.0205H14.1447C15.2492 31.0205 16.1447 30.1251 16.1447 29.0205V25.5205ZM8.14465 21.0205C7.04008 21.0205 6.14465 21.9159 6.14465 23.0205V31.5205C6.14465 32.6251 7.04008 33.5205 8.14465 33.5205H16.6447C17.7492 33.5205 18.6447 32.6251 18.6447 31.5205V23.0205C18.6447 21.9159 17.7492 21.0205 16.6447 21.0205H8.14465ZM23.6447 10.5205C23.6447 9.41594 24.5401 8.52051 25.6447 8.52051H29.1447C30.2492 8.52051 31.1447 9.41594 31.1447 10.5205V14.0205C31.1447 15.1251 30.2492 16.0205 29.1447 16.0205H25.6447C24.5401 16.0205 23.6447 15.1251 23.6447 14.0205V10.5205ZM23.1447 18.5205C22.0401 18.5205 21.1447 17.6251 21.1447 16.5205V8.02051C21.1447 6.91594 22.0401 6.02051 23.1447 6.02051H31.6447C32.7492 6.02051 33.6447 6.91594 33.6447 8.02051V16.5205C33.6447 17.6251 32.7492 18.5205 31.6447 18.5205H23.1447ZM22.3947 28.5205C21.7043 28.5205 21.1447 27.9609 21.1447 27.2705V22.2705C21.1447 21.5802 21.7043 21.0205 22.3947 21.0205C23.085 21.0205 23.6447 21.5802 23.6447 22.2705V27.2705C23.6447 27.9609 23.085 28.5205 22.3947 28.5205ZM12.3947 11.0205C11.7043 11.0205 11.1447 11.5802 11.1447 12.2705C11.1447 12.9609 11.7043 13.5205 12.3947 13.5205C13.085 13.5205 13.6447 12.9609 13.6447 12.2705C13.6447 11.5802 13.085 11.0205 12.3947 11.0205ZM12.3947 28.5205C11.7043 28.5205 11.1447 27.9609 11.1447 27.2705C11.1447 26.5802 11.7043 26.0205 12.3947 26.0205C13.085 26.0205 13.6447 26.5802 13.6447 27.2705C13.6447 27.9609 13.085 28.5205 12.3947 28.5205ZM27.3947 11.0205C26.7043 11.0205 26.1447 11.5802 26.1447 12.2705C26.1447 12.9609 26.7043 13.5205 27.3947 13.5205C28.085 13.5205 28.6447 12.9609 28.6447 12.2705C28.6447 11.5802 28.085 11.0205 27.3947 11.0205ZM32.3947 33.5205C31.7043 33.5205 31.1447 32.9609 31.1447 32.2705V31.0205C31.1447 30.3302 31.7043 29.7705 32.3947 29.7705C33.085 29.7705 33.6447 30.3302 33.6447 31.0205V32.2705C33.6447 32.9609 33.085 33.5205 32.3947 33.5205ZM32.3947 21.0205C31.7043 21.0205 31.1447 21.5802 31.1447 22.2705V23.5205C31.1447 24.2109 30.585 24.7705 29.8947 24.7705C29.2043 24.7705 28.6447 24.2109 28.6447 23.5205V22.2705C28.6447 21.5802 28.085 21.0205 27.3947 21.0205C26.7043 21.0205 26.1447 21.5802 26.1447 22.2705V29.0205C26.1447 30.1251 25.2492 31.0205 24.1447 31.0205H22.3947C21.7043 31.0205 21.1447 31.5802 21.1447 32.2705C21.1447 32.9609 21.7043 33.5205 22.3947 33.5205H26.6447C27.7492 33.5205 28.6447 32.6251 28.6447 31.5205V29.2705C28.6447 28.1659 29.5401 27.2705 30.6447 27.2705H31.6447C32.7492 27.2705 33.6447 26.3751 33.6447 25.2705V24.7705V22.2705C33.6447 21.5802 33.085 21.0205 32.3947 21.0205Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.DownChevron:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1.69561 9.71596C0.768128 10.6706 0.768128 12.2183 1.69561 13.1729L18.3207 30.2841C19.2481 31.2386 20.752 31.2386 21.6794 30.2841L38.3044 13.1729C39.2319 12.2183 39.2319 10.6706 38.3044 9.71596C37.377 8.76135 35.8731 8.76135 34.9457 9.71596L20 25.0987L5.05439 9.71596C4.12688 8.76135 2.62312 8.76135 1.69561 9.71596Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.Supplier:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 512 512"
          fill="none">
          <Path
            d="M270 248C280.746 254.642 287.112 264.095 291 276C293.419 288.051 291.993 300.246 285.484 310.852C276.365 324.05 263.263 329.687 249 336C250.103 335.992 251.207 335.984 252.343 335.976C253.914 335.969 255.484 335.962 257.055 335.957C257.907 335.954 258.759 335.951 259.637 335.948C265.182 335.948 270.703 336.092 276.242 336.334C308.069 337.632 332.296 331.487 361.204 318.549C369.313 314.941 377.59 311.778 385.877 308.607C389.228 307.322 392.57 306.016 395.913 304.709C405.598 300.922 415.293 297.161 424.999 293.429C426.481 292.858 427.962 292.287 429.443 291.714C431.466 290.932 433.49 290.155 435.516 289.379C436.653 288.941 437.79 288.504 438.962 288.053C449.858 284.277 460.488 285.491 471 290C480.657 295.648 487.191 304.138 490.344 314.82C492.598 325.741 491.217 336.115 485.375 345.625C479.279 353.977 471.641 359.202 462.43 363.645C461.432 364.14 460.433 364.635 459.405 365.145C456.235 366.715 453.055 368.264 449.875 369.813C447.798 370.838 445.721 371.865 443.645 372.893C434.683 377.318 425.694 381.68 416.664 385.965C406.66 390.713 396.741 395.613 386.859 400.609C385.533 401.279 384.207 401.948 382.881 402.618C377.471 405.349 372.06 408.082 366.659 410.832C348.005 420.323 329.592 429.333 309.125 434.25C308.242 434.48 307.359 434.709 306.449 434.945C284.575 440.346 262.914 440.413 240.552 440.304C235.984 440.285 231.416 440.284 226.847 440.28C218.231 440.271 209.615 440.246 200.999 440.216C189.332 440.176 177.665 440.16 165.997 440.143C147.665 440.115 129.333 440.055 111 440C111 388.52 111 337.04 111 284C124.436 280.641 124.436 280.641 131.09 279.387C132.538 279.11 133.985 278.832 135.433 278.553C136.537 278.342 136.537 278.342 137.663 278.126C159.57 273.9 179.656 268.276 200 259C201.277 258.419 202.555 257.839 203.832 257.258C204.844 256.798 204.844 256.798 205.877 256.329C207.274 255.695 208.671 255.06 210.069 254.427C213.526 252.859 216.981 251.285 220.429 249.697C221.711 249.112 222.992 248.527 224.273 247.941C225.402 247.423 226.53 246.904 227.693 246.369C241.279 240.744 257.008 240.833 270 248Z"
            fill={props.color}
          />
          <Path
            d="M136 144C167.68 144 199.36 144 232 144C232.33 152.91 232.66 161.82 233 171C234.924 179.659 236.134 184.806 242.875 190.375C249.769 193.96 255.477 194.595 263 193C270.461 190.618 276.143 184.973 282 180C283.662 178.661 285.327 177.326 287 176C290.899 177.693 294.066 180.26 297.375 182.875C308.343 191.706 308.343 191.706 321.938 193.875C327.891 193.062 332.651 191.605 336.758 187.051C345.819 174.51 343.445 158.973 344 144C375.68 144 407.36 144 440 144C440 186.57 440 229.14 440 273C431.09 276.3 422.18 279.6 413 283C406.368 285.599 399.742 288.202 393.13 290.849C376.19 297.621 359.223 304.328 342.214 310.924C340.174 311.717 338.135 312.515 336.098 313.317C333.26 314.435 330.416 315.536 327.57 316.633C326.746 316.961 325.922 317.289 325.073 317.627C317.461 320.526 309.987 321.167 301.875 321.062C300.944 321.053 300.014 321.044 299.055 321.035C298.377 321.024 297.699 321.012 297 321C298.283 316.979 299.777 313.163 301.5 309.312C307.692 294.536 307.532 279.223 301.523 264.344C293.487 247.464 282.441 237.199 264.875 230.875C259.021 229.093 253.587 228.756 247.5 228.688C246.678 228.658 245.855 228.629 245.008 228.6C231.768 228.467 220.146 234.555 208.465 240.111C158.073 264 158.073 264 136 264C136 224.4 136 184.8 136 144Z"
            fill={props.color}
          />
          <Path
            d="M43.2696 263.664C44.2646 263.657 45.2596 263.651 46.2847 263.644C48.3868 263.634 50.489 263.629 52.5912 263.629C55.7912 263.625 58.9898 263.589 62.1896 263.551C64.2371 263.545 66.2846 263.541 68.3321 263.539C69.756 263.518 69.756 263.518 71.2085 263.496C78.437 263.545 83.7588 265.16 89.2423 269.965C89.7811 270.616 90.3199 271.267 90.8751 271.938C91.4294 272.586 91.9837 273.234 92.5548 273.902C95.6242 278.357 96.2519 282.186 96.2675 287.546C96.2721 288.19 96.2766 288.833 96.2812 289.497C96.2939 291.646 96.2923 293.795 96.2906 295.945C96.2966 297.489 96.3034 299.033 96.311 300.578C96.3286 304.768 96.3333 308.958 96.3346 313.148C96.336 315.768 96.3403 318.388 96.3456 321.008C96.3641 330.153 96.3723 339.298 96.3707 348.443C96.3695 356.958 96.3906 365.473 96.4222 373.989C96.4484 381.307 96.4591 388.625 96.4578 395.944C96.4573 400.311 96.4629 404.679 96.4841 409.046C96.5036 413.156 96.5036 417.265 96.4891 421.375C96.487 422.88 96.4917 424.384 96.5038 425.888C96.5728 435.045 96.3404 442.047 90.0353 449.242C89.3843 449.781 88.7333 450.32 88.0626 450.875C87.09 451.707 87.09 451.707 86.0978 452.555C80.5157 456.401 75.2982 456.321 68.7306 456.336C67.7356 456.343 66.7406 456.349 65.7155 456.356C63.6134 456.366 61.5112 456.371 59.409 456.371C56.209 456.375 53.0104 456.411 49.8106 456.449C47.7631 456.455 45.7156 456.459 43.6681 456.461C42.7188 456.475 41.7696 456.49 40.7916 456.505C33.5632 456.455 28.2414 454.84 22.7579 450.035C21.9497 449.059 21.9497 449.059 21.1251 448.063C20.5708 447.414 20.0165 446.766 19.4454 446.098C16.376 441.643 15.7483 437.815 15.7327 432.454C15.7281 431.811 15.7236 431.167 15.7189 430.503C15.7063 428.354 15.7079 426.205 15.7096 424.056C15.7036 422.511 15.6968 420.967 15.6892 419.422C15.6716 415.232 15.6669 411.042 15.6656 406.852C15.6642 404.232 15.6599 401.612 15.6546 398.992C15.6361 389.847 15.6279 380.702 15.6295 371.557C15.6307 363.042 15.6096 354.527 15.578 346.011C15.5518 338.693 15.5411 331.375 15.5424 324.057C15.5429 319.689 15.5373 315.322 15.516 310.954C15.4966 306.844 15.4966 302.735 15.5111 298.625C15.5132 297.121 15.5085 295.616 15.4964 294.112C15.4274 284.956 15.6598 277.953 21.9649 270.758C22.6159 270.219 23.2669 269.68 23.9376 269.125C24.586 268.571 25.2344 268.016 25.9024 267.445C31.4845 263.599 36.702 263.679 43.2696 263.664Z"
            fill={props.color}
          />
          <Path
            d="M248 56C274.4 56 300.8 56 328 56C328.12 85.8684 328.12 85.8684 328.151 100.59C328.167 108.561 328.188 116.533 328.226 124.504C328.256 130.814 328.275 137.124 328.282 143.434C328.286 146.776 328.295 150.117 328.317 153.459C328.339 157.188 328.342 160.915 328.34 164.644C328.351 165.755 328.362 166.866 328.373 168.011C328.369 169.025 328.365 170.039 328.361 171.084C328.363 171.966 328.366 172.848 328.369 173.757C327.917 176.504 327.212 177.353 325 179C320.774 180.219 318.758 180.372 314.773 178.414C310.485 175.823 306.703 172.654 302.875 169.438C295.845 162.776 295.845 162.776 287.113 159.992C283.062 161.304 280.419 163.414 277.187 166.125C276.269 166.867 276.269 166.867 275.332 167.625C272.639 169.802 269.981 172.016 267.336 174.25C262.998 177.828 259.902 180.227 254 180C251.624 178.863 249.855 177.856 248 176C247.904 174.444 247.878 172.883 247.88 171.324C247.878 170.313 247.877 169.302 247.875 168.26C247.879 167.142 247.883 166.023 247.886 164.871C247.886 163.7 247.886 162.53 247.886 161.324C247.887 158.105 247.892 154.886 247.899 151.667C247.905 148.307 247.905 144.946 247.907 141.585C247.91 135.218 247.918 128.85 247.928 122.482C247.94 114.524 247.946 106.566 247.951 98.6074C247.961 84.4049 247.981 70.2025 248 56Z"
            fill={props.color}
          />
          <Path
            d="M344 56.0001C363.395 55.8397 363.395 55.8397 371.691 55.8048C377.342 55.7809 382.993 55.7528 388.644 55.6984C393.202 55.6548 397.76 55.631 402.319 55.6206C404.054 55.6132 405.789 55.5989 407.524 55.5772C409.963 55.548 412.401 55.5442 414.84 55.546C415.905 55.5244 415.905 55.5244 416.991 55.5024C423.407 55.5547 428.471 57.784 433.242 61.965C433.781 62.6159 434.32 63.2669 434.875 63.9376C435.429 64.586 435.984 65.2344 436.555 65.9025C439.402 70.035 440.25 73.6354 440.227 78.6166C440.227 79.7326 440.227 80.8487 440.226 81.9985C440.216 83.1605 440.206 84.3225 440.195 85.5197C440.193 86.5958 440.191 87.672 440.189 88.7808C440.179 92.7914 440.151 96.802 440.125 100.813C440.084 109.784 440.043 118.756 440 128C408.32 128 376.64 128 344 128C344 104.24 344 80.4801 344 56.0001Z"
            fill={props.color}
          />
          <Path
            d="M160.82 55.7728C161.591 55.7725 162.362 55.7722 163.157 55.7719C165.694 55.7733 168.232 55.7888 170.77 55.8045C172.534 55.8083 174.298 55.8111 176.062 55.8131C180.696 55.8207 185.33 55.8404 189.965 55.8625C195.53 55.8866 201.095 55.8958 206.66 55.9074C215.107 55.9268 223.553 55.9651 232 55.9999C232 79.7599 232 103.52 232 128C200.32 128 168.64 128 136 128C135.918 119.09 135.835 110.18 135.75 101C135.714 98.2013 135.677 95.4027 135.64 92.5194C135.628 90.2837 135.618 88.048 135.609 85.8124C135.589 84.6657 135.568 83.5191 135.547 82.3377C135.544 74.3584 136.558 68.9282 141.965 62.7577C142.616 62.2188 143.267 61.68 143.938 61.1249C144.586 60.5706 145.234 60.0163 145.902 59.4452C150.713 56.1306 155.1 55.7157 160.82 55.7728Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.Retailer:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 512 512"
          fill="none">
          <Path
            d="M152.838 16.8865C154.31 16.8867 154.31 16.8867 155.81 16.8868C156.867 16.8919 157.923 16.8971 159.011 16.9024C160.637 16.9045 160.637 16.9045 162.294 16.9067C165.759 16.9123 169.223 16.9249 172.687 16.9376C175.034 16.9426 177.381 16.9471 179.728 16.9512C185.485 16.9623 191.243 16.979 197 17.0001C197.001 17.9845 197.003 18.969 197.004 19.9833C197.021 29.2817 197.064 38.5796 197.132 47.8777C197.166 52.6575 197.191 57.4369 197.195 62.2169C197.2 66.8337 197.228 71.4499 197.273 76.0665C197.286 77.8238 197.29 79.5812 197.286 81.3386C196.93 93.1498 196.93 93.1498 201.62 103.649C205.611 107.557 209.203 109.22 214.812 109.563C226.227 108.895 236.792 99.9167 246.074 93.9122C247.137 93.2515 248.201 92.5909 249.297 91.9102C250.249 91.3032 251.201 90.6961 252.182 90.0706C255 89.0001 255 89.0001 257.973 89.5916C261.183 91.0855 264.132 92.7441 267.133 94.6251C267.692 94.9726 268.251 95.3202 268.827 95.6783C270.597 96.7797 272.361 97.8895 274.125 99.0001C275.897 100.109 277.67 101.216 279.444 102.322C281.05 103.323 282.652 104.329 284.254 105.336C290.412 109.068 294.792 109.67 302 109C307.474 107.109 309.996 104.077 313.089 99.3273C314.394 95.9917 314.308 92.7334 314.319 89.2022C314.329 88.4213 314.339 87.6405 314.349 86.8359C314.38 84.2605 314.397 81.6851 314.414 79.1094C314.433 77.3215 314.452 75.5336 314.473 73.7457C314.524 69.044 314.563 64.3423 314.601 59.6404C314.641 54.841 314.692 50.0416 314.742 45.2423C314.839 35.8283 314.923 26.4142 315 17.0001C321.85 16.8984 328.7 16.8285 335.55 16.7803C337.879 16.7603 340.208 16.733 342.537 16.6983C345.89 16.6496 349.243 16.6271 352.597 16.6094C353.633 16.5888 354.669 16.5682 355.736 16.5469C362.061 16.5449 365.868 17.2119 371 21.0001C375.517 26.8247 376.147 31.2446 376.133 38.4135C376.136 39.2823 376.138 40.1512 376.14 41.0463C376.147 43.9689 376.146 46.8914 376.145 49.814C376.148 51.9049 376.151 53.9957 376.155 56.0865C376.164 61.7745 376.166 67.4625 376.167 73.1505C376.168 77.8947 376.172 82.6388 376.175 87.383C376.183 98.5737 376.186 109.764 376.185 120.955C376.184 132.508 376.195 144.062 376.211 155.615C376.224 165.526 376.229 175.437 376.229 185.348C376.228 191.271 376.231 197.193 376.242 203.116C376.251 208.686 376.252 214.256 376.244 219.826C376.243 221.872 376.246 223.918 376.252 225.963C376.259 228.753 376.255 231.543 376.247 234.333C376.252 235.145 376.257 235.957 376.263 236.794C376.237 240.968 375.887 244.247 374 248C357.381 249.661 346.247 246.976 331.746 239.018C324.526 235.088 317.134 231.479 309.782 227.804C307.102 226.457 304.429 225.096 301.758 223.732C300.079 222.882 298.401 222.033 296.722 221.184C295.962 220.791 295.201 220.399 294.417 219.995C283.481 214.501 271.216 212.901 259.312 216.375C257.044 217.151 254.993 218.004 252.867 219.113C248.687 221.098 243.601 218.249 239.476 216.816C236.343 215.784 233.176 214.893 230 214C229.99 213.406 229.981 212.812 229.971 212.199C229.917 209.465 229.834 206.733 229.75 204C229.736 203.065 229.721 202.131 229.707 201.168C229.501 195.289 229.011 189.591 225 185C218.93 180.435 213.618 180.413 206.187 180.469C205.06 180.465 203.932 180.461 202.77 180.457C200.393 180.455 198.016 180.462 195.639 180.479C192.011 180.5 188.385 180.479 184.758 180.453C182.442 180.456 180.127 180.461 177.812 180.469C176.733 180.461 175.654 180.453 174.542 180.444C167.456 180.532 162.599 181.315 157.459 186.578C154.154 192.965 154.395 199.807 154.478 206.836C154.5 208.996 154.478 211.153 154.453 213.313C154.437 220.801 154.626 226.734 159 233C160.792 234.698 160.792 234.698 162.75 235.5C164.359 236.243 164.359 236.243 166 237C166 237.66 166 238.32 166 239C163.226 240.534 160.428 242.021 157.625 243.5C156.463 244.144 156.463 244.144 155.277 244.801C149.359 247.882 144.634 248.568 138 248C135.749 243.512 135.714 239.278 135.732 234.366C135.728 233.498 135.723 232.629 135.719 231.735C135.706 228.825 135.708 225.916 135.709 223.007C135.703 220.92 135.696 218.834 135.689 216.748C135.671 211.08 135.667 205.413 135.665 199.746C135.663 195.014 135.656 190.283 135.649 185.551C135.633 174.387 135.628 163.223 135.629 152.059C135.63 140.544 135.609 129.03 135.578 117.515C135.552 107.628 135.541 97.7407 135.542 87.8534C135.543 81.9488 135.537 76.0444 135.516 70.1398C135.496 64.5854 135.496 59.0314 135.511 53.477C135.513 51.4404 135.508 49.4039 135.496 47.3674C135.481 44.5828 135.49 41.7993 135.505 39.0148C135.495 38.2127 135.485 37.4106 135.474 36.5843C135.542 30.9727 136.885 26.6989 140 22.0001C144.112 18.088 147.235 16.8721 152.838 16.8865Z"
            fill={props.color}
          />
          <Path
            d="M225.875 229.688C227.201 229.724 227.201 229.724 228.555 229.762C230.8 229.981 232.834 230.381 235 231C233.602 234.131 231.944 236.349 229.586 238.828C228.907 239.546 228.227 240.264 227.527 241.004C226.462 242.116 226.462 242.116 225.375 243.25C224.688 243.976 224.001 244.702 223.293 245.449C219.189 249.769 215.017 254.01 210.773 258.192C209.016 259.984 207.374 261.837 205.75 263.75C203.166 266.773 200.435 269.563 197.586 272.331C188.813 280.872 181.161 288.987 180.625 301.75C180.792 310.163 183.467 317.27 189.223 323.465C196.098 329.404 203.157 331.408 212.07 331.266C225.46 330.052 234.81 319.396 243.719 310.314C247.082 306.886 250.554 303.685 254.207 300.574C256.054 298.953 257.778 297.254 259.5 295.5C263.992 290.936 268.665 286.557 274 283C284.805 290.898 295.526 298.895 306.152 307.031C311.95 311.462 317.798 315.817 323.688 320.125C332.251 326.395 340.632 332.88 348.985 339.426C351.893 341.698 354.821 343.944 357.75 346.188C400.895 379.343 400.895 379.343 406 387C406.639 393.387 405.85 396.833 402 402C397.672 404.982 394.199 405.639 389 405C386.108 403.724 383.257 402.257 381 400C376.342 399.547 376.342 399.547 372.125 401.188C370.555 403.718 370 404.966 370 408C371.144 410.074 372.455 411.994 373.773 413.961C375.973 417.617 376.379 420.903 375.625 425.074C374.502 428.872 373.176 431.322 369.812 433.5C365.96 435.305 362.172 435.975 358 435C355.893 433.797 353.947 432.444 351.953 431.063C349.812 429.703 349.812 429.703 346.188 429.938C343.014 430.777 343.014 430.777 341 432.688C339.596 435.935 339.988 437.626 341 441C341.681 441.908 342.361 442.815 343.062 443.75C345.725 448.216 345.697 451.918 345 457C343.705 460.204 342.48 461.591 339.875 463.813C335.243 465.726 330.601 466.073 325.898 464.133C323.78 462.939 321.731 461.731 320 460C318.475 460.09 316.953 460.246 315.438 460.438C314.611 460.54 313.785 460.641 312.934 460.746C312.296 460.83 311.657 460.914 311 461C309.67 466.105 309.67 466.105 311.047 470.961C311.506 471.593 311.965 472.224 312.438 472.875C315.683 477.459 315.858 481.53 315 487C313.719 490.17 312.48 491.578 309.938 493.813C305.68 495.534 301.518 495.863 297 495C292.149 492.25 288.259 488.633 284.25 484.813C280.439 480.979 280.439 480.979 276 478C276.165 477.113 276.33 476.226 276.5 475.313C277.923 464.819 278.107 454.723 271.457 445.969C265.455 439.486 258.475 436.816 250 435C249.853 433.732 249.853 433.732 249.703 432.438C248.402 422.569 246.417 415.482 239.062 408.539C234.031 404.785 228.104 403.108 222 402C221.853 400.732 221.853 400.732 221.703 399.438C220.408 389.615 218.459 382.377 211.016 375.543C205.11 371.023 199.835 369.822 192.534 370.244C188.886 370.454 185.645 370.476 182 370C179.53 367.737 178.567 365.736 177.238 362.68C174.715 357.22 169.671 353.492 164.25 351.063C156.122 348.513 148.101 349.401 140.352 352.637C134.344 356.12 130.407 360.707 126.312 366.188C121.383 372.745 121.383 372.745 118 375C115.331 374.113 112.876 373.133 110.312 372C102.981 368.959 95.6421 366.655 87.9375 364.75C87.0066 364.517 86.0756 364.284 85.1165 364.043C76.4474 361.956 67.8266 360.558 59 359C59 327.65 59 296.3 59 264C103.75 263.813 103.75 263.813 117.815 263.792C122.021 263.763 122.021 263.763 126.227 263.726C128.082 263.713 129.937 263.71 131.793 263.714C142.937 263.734 151.993 263.455 162 258C163.869 257.095 165.739 256.193 167.61 255.293C169.515 254.333 171.419 253.37 173.32 252.403C174.857 251.628 174.857 251.628 176.426 250.838C179.661 249.209 182.893 247.574 186.125 245.938C190.396 243.775 194.67 241.619 198.945 239.465C199.906 238.976 200.867 238.488 201.856 237.984C218.925 229.389 218.925 229.389 225.875 229.688Z"
            fill={props.color}
          />
          <Path
            d="M302.184 240.48C303.414 241.101 304.644 241.72 305.874 242.339C309.079 243.953 312.281 245.573 315.482 247.196C320.627 249.804 325.775 252.405 330.927 255C332.717 255.903 334.504 256.811 336.291 257.72C337.919 258.541 337.919 258.541 339.58 259.379C340.533 259.863 341.485 260.346 342.467 260.843C346.178 262.537 349.363 263.124 353.429 263.158C354.75 263.173 354.75 263.173 356.098 263.188C357.056 263.193 358.014 263.199 359.001 263.205C360.523 263.22 360.523 263.22 362.077 263.235C365.431 263.267 368.786 263.291 372.141 263.316C374.467 263.337 376.793 263.358 379.119 263.379C385.241 263.434 391.363 263.484 397.485 263.532C404.831 263.591 412.176 263.657 419.522 263.722C430.681 263.82 441.841 263.909 453 264C453 295.35 453 326.7 453 359C440.13 360.98 440.13 360.98 427 363C420.899 364.583 420.899 364.583 414.856 366.363C411.695 367.068 410.046 367.066 407 366C404.598 364.32 404.598 364.32 402.063 362.125C401.101 361.31 400.139 360.495 399.149 359.656C398.638 359.222 398.127 358.787 397.601 358.34C394.848 356.036 392.017 353.833 389.188 351.625C387.988 350.686 386.789 349.747 385.59 348.808C384.993 348.342 384.396 347.875 383.781 347.394C381.499 345.608 379.223 343.815 376.946 342.022C359.276 328.111 359.276 328.111 341.359 314.519C337.767 311.836 334.21 309.108 330.648 306.385C321.319 299.252 311.936 292.201 302.453 285.273C299.542 283.144 296.659 280.984 293.797 278.789C283.874 270.53 283.874 270.53 271.738 268.265C265.516 269.913 261.528 273.62 257 278C255.524 279.357 254.048 280.714 252.569 282.067C247.781 286.456 243.039 290.895 238.295 295.331C235.787 297.674 233.277 300.015 230.766 302.354C229.62 303.422 228.476 304.49 227.332 305.559C225.83 306.961 224.321 308.356 222.813 309.75C221.554 310.918 221.554 310.918 220.27 312.109C215.973 315.688 212.757 316.452 207.25 316.316C202.703 315.677 200.019 313.188 197.125 309.812C195.554 305.884 195.133 302.16 196 298C198.974 292.73 203.028 288.546 207.188 284.187C207.856 283.48 208.524 282.773 209.213 282.045C213.435 277.594 217.735 273.231 222.106 268.926C223.928 267.073 225.626 265.164 227.313 263.187C230.857 259.048 234.709 255.257 238.588 251.436C241.452 248.6 244.164 245.721 246.75 242.625C263.426 223.297 282.382 230.393 302.184 240.48Z"
            fill={props.color}
          />
          <Path
            d="M213 17C241.38 17 269.76 17 299 17C299 42.41 299 67.82 299 94C292.25 92.875 292.25 92.875 289.413 91.1582C288.462 90.5926 288.462 90.5926 287.493 90.0155C286.499 89.4045 286.499 89.4045 285.484 88.7812C284.787 88.3633 284.09 87.9454 283.372 87.5148C281.159 86.1854 278.955 84.8431 276.75 83.5C275.253 82.5968 273.756 81.6944 272.258 80.793C270.154 79.5266 268.051 78.259 265.952 76.9845C259.921 73.2958 259.921 73.2958 253 73C250.475 74.1548 248.237 75.3273 245.875 76.75C245.199 77.1418 244.523 77.5336 243.827 77.9373C239.734 80.3255 235.691 82.7958 231.648 85.2695C230.751 85.8158 229.854 86.362 228.93 86.9248C227.165 88.0034 225.405 89.0911 223.652 90.1885C222.844 90.6844 222.036 91.1804 221.203 91.6914C220.488 92.1369 219.773 92.5823 219.036 93.0413C217 94 217 94 213 94C213 68.59 213 43.18 213 17Z"
            fill={props.color}
          />
          <Path
            d="M469 247C477.58 247 486.16 247 495 247C495 289.57 495 332.14 495 376C486.42 376 477.84 376 469 376C469 333.43 469 290.86 469 247Z"
            fill={props.color}
          />
          <Path
            d="M17 247C25.58 247 34.16 247 43 247C43 289.57 43 332.14 43 376C34.42 376 25.84 376 17 376C17 333.43 17 290.86 17 247Z"
            fill={props.color}
          />
          <Path
            d="M197 385C200.709 386.786 202.54 388.362 204.938 391.688C206.405 396.264 206.584 399.425 205 404C202.39 408.311 199.212 412.131 196 416C194.894 417.358 193.79 418.718 192.688 420.078C191.001 422.16 189.311 424.238 187.606 426.305C185.042 429.422 182.568 432.556 180.246 435.859C177.9 439.14 176.748 440.584 173 442C167.898 442.685 164.146 442.573 159.5 440.25C155.943 437.049 154.673 434.2 154.375 429.438C154.551 423.084 157.664 419.37 161.634 414.632C163.162 412.806 164.654 410.954 166.145 409.098C168.372 406.33 170.614 403.576 172.871 400.832C174.77 398.519 176.644 396.193 178.473 393.824C179.507 392.488 179.507 392.488 180.562 391.125C181.141 390.365 181.72 389.604 182.316 388.82C186.42 384.383 191.276 384.205 197 385Z"
            fill={props.color}
          />
          <Path
            d="M227.812 419.125C231.923 422.648 233.812 425.518 234.5 430.937C234.624 438.223 228.015 444.693 223.625 449.937C222.511 451.279 221.399 452.621 220.289 453.965C219.744 454.623 219.199 455.282 218.638 455.96C216.45 458.685 214.397 461.499 212.36 464.338C209.804 467.461 206.983 468.685 203.055 469.309C199.255 469.547 197.167 469.082 193.688 467.375C189.674 463.828 188.237 460.859 187.562 455.562C188.474 448.144 193.724 442.62 198.375 437.062C202.286 432.352 206.093 427.614 209.695 422.662C214.247 416.867 221.299 416.52 227.812 419.125Z"
            fill={props.color}
          />
          <Path
            d="M158 365C162.36 367.221 165.133 369.436 167 374C167.803 381.109 165.797 385.273 161.55 390.933C159.933 392.957 158.287 394.951 156.625 396.938C155.511 398.279 154.399 399.621 153.289 400.965C152.744 401.623 152.199 402.282 151.638 402.961C149.45 405.685 147.397 408.499 145.36 411.338C142.804 414.461 139.983 415.686 136.055 416.309C132.255 416.547 130.167 416.082 126.688 414.375C122.674 410.828 121.237 407.859 120.562 402.563C121.507 394.871 127.087 389.215 131.938 383.5C137.049 377.449 137.049 377.449 141.766 371.09C145.866 365.42 151.26 363.789 158 365Z"
            fill={props.color}
          />
          <Path
            d="M253 451C257.359 453.221 260.168 455.421 262 460C263.1 467.337 261.117 470.768 256.753 476.693C243.604 494.284 243.604 494.284 237.562 495.484C233.165 495.72 230.474 495.237 226.5 493.25C222.943 490.049 221.673 487.2 221.375 482.438C221.529 475.42 225.667 471.174 230 466C230.767 465.01 231.534 464.02 232.324 463C243.235 449.07 243.235 449.07 253 451Z"
            fill={props.color}
          />
          <Path
            d="M170 196C184.52 196 199.04 196 214 196C214 202.6 214 209.2 214 216C200.086 224.145 185.623 222.543 170 222C170 213.42 170 204.84 170 196Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.Filter:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            d="M23.8677 31.783C23.8677 32.7997 23.2008 34.133 22.3508 34.6497L20.0008 36.1663C17.8175 37.5163 14.7842 35.9997 14.7842 33.2997V24.383C14.7842 23.1997 14.1176 21.683 13.4342 20.8497L7.03419 14.1163C6.18419 13.2663 5.51758 11.7663 5.51758 10.7496V6.88293C5.51758 4.86626 7.03428 3.34961 8.88428 3.34961H31.1175C32.9675 3.34961 34.4843 4.86624 34.4843 6.71624V10.4163C34.4843 11.7663 33.6342 13.4496 32.8008 14.2829"
            stroke={props.color}
            strokeWidth={stroke}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M26.782 27.5334C29.7275 27.5334 32.1153 25.1455 32.1153 22.2C32.1153 19.2545 29.7275 16.8667 26.782 16.8667C23.8363 16.8667 21.4485 19.2545 21.4485 22.2C21.4485 25.1455 23.8363 27.5334 26.782 27.5334Z"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M33.1152 28.5334L31.4485 26.8667"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.Global:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 40 40"
          fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.6765 32.8934C16.0206 33.5384 16.3652 34.1196 16.6946 34.6346C13.1949 33.8476 10.1581 31.8374 8.05676 29.0766C9.44362 28.2956 11.2199 27.486 13.3553 26.8936C13.9622 29.274 14.8185 31.2846 15.6765 32.8934ZM18.3236 31.4816C17.5782 30.0842 16.8312 28.339 16.293 26.2712C17.4516 26.0992 18.6884 26 20.0002 26C21.3118 26 22.5486 26.0992 23.707 26.271C23.1688 28.339 22.4218 30.0842 21.6764 31.4816C21.0788 32.6022 20.4834 33.4968 20 34.1514C19.5166 33.4968 18.9212 32.6022 18.3236 31.4816ZM15.5 20C15.5 21.1682 15.5786 22.277 15.7172 23.3238C17.0538 23.1188 18.4828 23 20.0002 23C21.5174 23 22.9464 23.1186 24.2828 23.3238C24.4214 22.2768 24.5 21.1682 24.5 20C24.5 18.8318 24.4214 17.7232 24.2828 16.6762C22.9464 16.8812 21.5174 17 20.0002 17C18.4828 17 17.0538 16.8812 15.7172 16.6762C15.5786 17.723 15.5 18.8318 15.5 20ZM12.7738 16.0576C12.5995 17.2956 12.5 18.6108 12.5 20C12.5 21.3892 12.5995 22.7044 12.7738 23.9424C10.2268 24.6262 8.11764 25.5904 6.48648 26.5182C5.53396 24.5472 5 22.336 5 20C5 17.664 5.53396 15.4529 6.48646 13.4818C8.11744 14.4094 10.2266 15.3737 12.7738 16.0576ZM16.293 13.7289C17.4516 13.9008 18.6884 14 20.0002 14C21.3118 14 22.5486 13.9009 23.707 13.7289C23.1688 11.6611 22.4218 9.91586 21.6764 8.5184C21.0788 7.39788 20.4834 6.50312 20 5.84864C19.5166 6.50312 18.9212 7.39788 18.3236 8.51836C17.5782 9.91582 16.8312 11.6611 16.293 13.7289ZM27.2262 16.0578C27.4004 17.2958 27.5 18.611 27.5 20C27.5 21.3892 27.4004 22.7042 27.2262 23.9422C29.7732 24.6262 31.8824 25.5904 33.5136 26.5182C34.466 24.547 35 22.3358 35 20C35 17.6642 34.466 15.4529 33.5136 13.4819C31.8826 14.4095 29.7734 15.3738 27.2262 16.0578ZM31.9432 10.9236C30.5562 11.7046 28.78 12.5141 26.6448 13.1066C26.0378 10.7261 25.1816 8.71538 24.3236 7.10664C23.9794 6.46154 23.6348 5.8805 23.3054 5.3654C26.8052 6.15246 29.842 8.16272 31.9432 10.9236ZM13.3553 13.1065C11.22 12.514 9.4438 11.7045 8.05678 10.9235C10.1581 8.16268 13.1949 6.15246 16.6944 5.3654C16.3652 5.8805 16.0206 6.46152 15.6765 7.1066C14.8185 8.71534 13.9622 10.726 13.3553 13.1065ZM26.6448 26.8934C26.0378 29.274 25.1816 31.2846 24.3236 32.8934C23.9794 33.5384 23.6348 34.1196 23.3054 34.6346C26.8052 33.8476 29.842 31.8372 31.9434 29.0764C30.5564 28.2954 28.7802 27.486 26.6448 26.8934ZM20 38C29.9412 38 38 29.9412 38 20C38 10.0589 29.9412 2 20 2C10.0589 2 2 10.0589 2 20C2 29.9412 10.0589 38 20 38Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Back:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 24"
          fill="none">
          <Mask
            id="mask0_58_1855"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={props.size}
            height={props.size}>
            <Rect width={props.size} height={props.size} fill={props.color} />
          </Mask>
          <G Mask="url(#mask0_58_1855)">
            <Path
              d="M7.37305 12.7501L12.5423 17.9193C12.691 18.068 12.7644 18.2421 12.7625 18.4414C12.7606 18.6408 12.682 18.818 12.5269 18.9732C12.3718 19.118 12.1962 19.193 12 19.1982C11.8039 19.2033 11.6282 19.1283 11.4731 18.9732L5.13273 12.6328C5.03914 12.5392 4.97312 12.4405 4.93465 12.3366C4.89619 12.2328 4.87695 12.1206 4.87695 12.0001C4.87695 11.8796 4.89619 11.7674 4.93465 11.6636C4.97312 11.5597 5.03914 11.461 5.13273 11.3674L11.4731 5.02706C11.6116 4.88859 11.783 4.81776 11.9875 4.81456C12.192 4.81136 12.3718 4.88219 12.5269 5.02706C12.682 5.18217 12.7596 5.36037 12.7596 5.56166C12.7596 5.76294 12.682 5.94114 12.5269 6.09626L7.37305 11.2501H18.75C18.9628 11.2501 19.141 11.3219 19.2846 11.4655C19.4282 11.6091 19.5 11.7873 19.5 12.0001C19.5 12.2129 19.4282 12.3911 19.2846 12.5347C19.141 12.6783 18.9628 12.7501 18.75 12.7501H7.37305Z"
              fill={props.color}
            />
          </G>
        </Svg>
      );

    case CustomIcons.Close:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 24"
          fill="none">
          <Mask
            id="mask0_58_1854"
            style={{maskType: 'alpha'}}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={props.size}
            height={props.size}>
            <Rect width={props.size} height={props.size} fill={props.color} />
          </Mask>
          <G Mask="url(#mask0_58_1854)">
            <Path
              d="M16.5792 13.1577L11.458 18.3039C11.2811 18.4808 11.0831 18.5683 10.8638 18.5664C10.6446 18.5645 10.4401 18.4686 10.2503 18.2789C10.0773 18.0891 9.99489 17.8962 10.0032 17.7C10.0116 17.5039 10.1023 17.3109 10.2753 17.1212L15.3715 12L10.2503 6.82889C10.0901 6.65197 10.0068 6.46223 10.0003 6.25966C9.99393 6.05709 10.0773 5.86094 10.2503 5.67119C10.4401 5.48144 10.6414 5.38239 10.8542 5.37406C11.067 5.36573 11.2683 5.45644 11.458 5.64619L16.5792 10.7923L21.6503 5.64619C21.8273 5.46927 22.0253 5.38177 22.2446 5.38369C22.4638 5.3856 22.6683 5.48144 22.858 5.67119C23.0311 5.86094 23.1135 6.05389 23.1052 6.25004C23.0968 6.44619 23.0061 6.63914 22.833 6.82889L17.7369 12L22.833 17.1212C22.9933 17.2814 23.0808 17.467 23.0955 17.6779C23.1103 17.8888 23.0311 18.0891 22.858 18.2789C22.6683 18.4686 22.467 18.5677 22.2542 18.576C22.0414 18.5843 21.8401 18.4936 21.6503 18.3039L16.5792 13.1577Z"
              fill={props.color}
            />
          </G>
        </Svg>
      );
    case CustomIcons.Search:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 24"
          fill="none">
          <Mask
            id="mask0_58_1857"
            style={{maskType: 'alpha'}}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={props.size}
            height={props.size}>
            <Rect width={props.size} height={props.size} fill={props.color} />
          </Mask>
          <G Mask="url(#mask0_58_1857)">
            <Path
              d="M9.51916 15.6155C7.81148 15.6155 6.36533 15.0232 5.18073 13.8386C3.99612 12.6539 3.40381 11.2078 3.40381 9.50012C3.40381 7.79243 3.99612 6.34628 5.18073 5.16167C6.36533 3.97707 7.81148 3.38477 9.51916 3.38477C11.2268 3.38477 12.673 3.97707 13.8576 5.16167C15.0422 6.34628 15.6345 7.79243 15.6345 9.50012C15.6345 10.2142 15.5147 10.8963 15.2749 11.5463C15.0352 12.1963 14.7153 12.7616 14.3153 13.2424L20.0692 18.9963C20.2076 19.1347 20.2784 19.3088 20.2816 19.5184C20.2849 19.728 20.214 19.9052 20.0692 20.0501C19.9243 20.195 19.7486 20.2674 19.5422 20.2674C19.3358 20.2674 19.1602 20.195 19.0153 20.0501L13.2615 14.2962C12.7615 14.7091 12.1865 15.0321 11.5365 15.2655C10.8865 15.4988 10.214 15.6155 9.51916 15.6155ZM9.51916 14.1155C10.8076 14.1155 11.899 13.6684 12.7932 12.7742C13.6874 11.8799 14.1346 10.7886 14.1346 9.50012C14.1346 8.21165 13.6874 7.1203 12.7932 6.22607C11.899 5.33183 10.8076 4.88472 9.51916 4.88472C8.23069 4.88472 7.13934 5.33183 6.24511 6.22607C5.35089 7.1203 4.90378 8.21165 4.90378 9.50012C4.90378 10.7886 5.35089 11.8799 6.24511 12.7742C7.13934 13.6684 8.23069 14.1155 9.51916 14.1155Z"
              fill={props.color}
            />
          </G>
        </Svg>
      );

    case CustomIcons.Diagram:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 24"
          fill="none">
          <Path
            d="M23 22H7.6C5.63981 22 4.65972 22 3.91104 21.6359C3.25246 21.3156 2.71703 20.8046 2.38148 20.1759C2 19.4612 2 18.5257 2 16.6546V1.95459M16 9.75004V17.5455M6.66667 13.091V17.5455M20.6667 4.18186V17.5455M11.3333 6.40914V17.5455"
            stroke={props.color}
            strokeWidth="1.90909"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.Expand_more:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 24"
          fill="none">
          <Mask
            id="mask0_58_1847"
            style={{maskType: 'alpha'}}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={props.size}
            height={props.size}>
            <Rect width={props.size} height={props.size} fill={props.color} />
          </Mask>
          <G Mask="url(#mask0_58_1847)">
            <Path
              d="M15.0001 16.6617C14.8796 16.6617 14.7675 16.6425 14.6636 16.604C14.5598 16.5656 14.4611 16.4996 14.3675 16.406L9.87325 11.9117C9.73478 11.7733 9.66395 11.5993 9.66075 11.3896C9.65753 11.18 9.72837 11.0028 9.87325 10.8579C10.0181 10.7131 10.1937 10.6406 10.4001 10.6406C10.6065 10.6406 10.7822 10.7131 10.927 10.8579L15.0001 14.931L19.0732 10.8579C19.2117 10.7195 19.3857 10.6486 19.5953 10.6454C19.8049 10.6422 19.9822 10.7131 20.127 10.8579C20.2719 11.0028 20.3444 11.1784 20.3444 11.3848C20.3444 11.5912 20.2719 11.7669 20.127 11.9117L15.6328 16.406C15.5392 16.4996 15.4405 16.5656 15.3367 16.604C15.2328 16.6425 15.1207 16.6617 15.0001 16.6617Z"
              fill={props.color}
            />
          </G>
        </Svg>
      );

    case CustomIcons.FullScreen:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 24"
          fill="none">
          <Mask
            id="mask0_58_1852"
            style={{maskType: 'alpha'}}
            maskUnits="userSpaceOnUse"
            x="2"
            y="2"
            width={props.size}
            height={props.size}>
            <Rect
              x="2"
              y="2"
              width={props.size}
              height="20"
              fill={props.color}
            />
          </Mask>
          <G Mask="url(#mask0_58_1852)">
            <Path
              d="M4.86388 20C4.62129 20 4.41667 19.918 4.25 19.7539C4.08333 19.5897 4 19.3864 4 19.1438V14.0067C4 13.7642 4.08166 13.5595 4.24498 13.3929C4.40831 13.2262 4.61069 13.1429 4.85212 13.1429C5.09356 13.1429 5.29762 13.2247 5.46429 13.3884C5.63095 13.5521 5.71429 13.7549 5.71429 13.9969V17.0714L17.0714 5.71429H13.9969C13.7549 5.71429 13.5521 5.63263 13.3884 5.46931C13.2247 5.30598 13.1429 5.1036 13.1429 4.86217C13.1429 4.62072 13.2249 4.41667 13.389 4.25C13.5531 4.08333 13.7565 4 13.999 4H19.1361C19.3787 4 19.5833 4.08205 19.75 4.24614C19.9167 4.41025 20 4.6136 20 4.85619V9.99326C20 10.2358 19.9183 10.4405 19.755 10.6071C19.5917 10.7738 19.3893 10.8571 19.1479 10.8571C18.9064 10.8571 18.7024 10.7753 18.5357 10.6116C18.369 10.4479 18.2857 10.2451 18.2857 10.0031V6.92857L6.92857 18.2857H10.0031C10.2451 18.2857 10.4479 18.3674 10.6116 18.5307C10.7753 18.694 10.8571 18.8964 10.8571 19.1378C10.8571 19.3793 10.7751 19.5833 10.611 19.75C10.4469 19.9167 10.2435 20 10.001 20H4.86388Z"
              fill={props.color}
            />
          </G>
        </Svg>
      );

    case CustomIcons.Group1:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 26"
          fill="none">
          <Path
            d="M18.2166 14.4722L12 20.2107L5.78337 14.4722C2.32042 16.6871 0 20.6837 0 25.2633H24C24 20.6837 21.6796 16.6871 18.2166 14.4722Z"
            fill={props.color}
          />
          <Path
            d="M12.0001 15.1579C14.2422 15.1579 16.25 14.1789 17.6376 12.6316C18.8407 11.2901 19.579 9.52295 19.579 7.57895C19.579 3.39347 16.1856 0 12.0001 0C7.81462 0 4.42114 3.39347 4.42114 7.57895C4.42114 9.52295 5.15946 11.2901 6.36262 12.6316C7.7502 14.1789 9.75799 15.1579 12.0001 15.1579Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Account:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 60 60"
          fill="none">
          <Path
            d="M12.5 52.5C12.5 42.835 20.335 35 30 35C39.665 35 47.5 42.835 47.5 52.5M40 17.5C40 23.0229 35.5228 27.5 30 27.5C24.4771 27.5 20 23.0229 20 17.5C20 11.9771 24.4771 7.5 30 7.5C35.5228 7.5 40 11.9771 40 17.5Z"
            stroke={props.color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.Associate:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 36 36"
          fill="none">
          <Path
            d="M26.8067 15.5739L26.8067 15.5739C26.2434 16.1286 26.2451 17.0283 26.8106 17.5808L26.8106 17.5808C27.3735 18.1306 28.2824 18.1289 28.8431 17.5768L32.6874 13.792C35.7989 10.7287 36.2173 5.80228 33.1679 2.80013L32.9925 2.97828L33.1679 2.80013C30.118 -0.202497 25.1131 0.209658 22.0013 3.27324L22.1767 3.45139L22.0013 3.27324L14.3126 10.8429C11.2011 13.9063 10.7827 18.8327 13.832 21.8348C14.3927 22.3869 15.3016 22.3886 15.8643 21.8388C16.43 21.2863 16.4317 20.3866 15.8684 19.8319L15.8684 19.8319C14.1387 18.1291 14.1546 15.0062 16.349 12.8459L16.1736 12.6677L16.349 12.8459L24.0376 5.27618C26.2318 3.11604 29.4024 3.10066 31.1316 4.80308C32.8612 6.506 32.8453 9.62876 30.6511 11.7891L26.8067 15.5739Z"
            fill={props.color}
            stroke={props.color}
            stroke-width="0.5"
          />
          <Path
            d="M20.1314 13.1816L20.1314 13.1816C19.5714 13.7548 19.5697 14.6833 20.1275 15.2587C21.8641 17.0499 21.8452 20.3353 19.647 22.6026L11.9583 30.5328C9.76432 32.7957 6.59999 32.8103 4.87249 31.0285L4.693 31.2025L4.87249 31.0285C3.13584 29.2373 3.15481 25.9517 5.35303 23.6844L9.1974 19.7194L9.19742 19.7194C9.75533 19.1439 9.75358 18.2156 9.1935 17.6422L9.19347 17.6422C8.62967 17.0652 7.71447 17.067 7.15289 17.6463L3.30853 21.6113L3.48593 21.7833L3.30852 21.6113C0.200753 24.8168 -0.214291 29.9637 2.82796 33.1016L3.00745 32.9276L2.82797 33.1016C5.87956 36.2489 10.891 35.8154 14.0028 32.6059L21.6915 24.6757C24.7992 21.4703 25.2143 16.3234 22.172 13.1856C21.6105 12.6064 20.6953 12.6046 20.1314 13.1816Z"
            fill={props.color}
            stroke={props.color}
            stroke-width="0.5"
          />
        </Svg>
      );

    case CustomIcons.Dissociate:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 38 38"
          fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M13.544 12.8213L3.17319 2.45046L5.62269 0.000165563L37.1544 31.5311L34.7042 33.9814L23.8942 23.1715C23.5153 27.8775 18.6289 31.5921 14.6556 35.5203C13.0052 37.109 10.7456 38.0141 8.45117 37.9998C1.87091 37.878 -3.11512 28.8031 2.30922 23.1739C5.41303 20.0313 8.33011 16.0817 11.7488 14.6165C12.0162 14.5017 12.2876 14.4044 12.5629 14.3229C12.5748 15.338 12.6603 16.6316 12.9546 17.71C12.4 17.9331 11.8809 18.2559 11.4244 18.6847C7.88626 22.0955 2.79343 25.3726 3.11385 29.675C3.31719 32.4046 5.79992 34.7481 8.6276 34.7299C10.0177 34.7046 11.3722 34.1412 12.3723 33.1792C16.3962 29.2011 22.251 25.0988 20.1812 20.4301C19.773 19.5099 19.0839 18.7686 18.2468 18.2409C18.1843 17.9711 18.1249 17.6728 18.0759 17.3532L16.3883 15.6648C16.397 16.2898 16.5315 16.9251 16.8179 17.5707C17.2254 18.4901 17.9145 19.2322 18.7524 19.7599C18.9731 20.7165 19.1582 22.0354 18.9644 23.3693C15.806 22.1533 13.218 19.2639 13.0859 15.6838C13.0487 14.6877 13.2172 13.7367 13.544 12.8213ZM17.0553 7.61687C18.6898 5.87865 20.6037 4.19976 22.3427 2.48052C23.9931 0.891036 26.2528 -0.0140757 28.5472 0.000165563C35.1274 0.122799 40.1143 9.19765 34.6891 14.8269C32.9841 16.5533 31.3353 18.5233 29.6287 20.1911L27.2354 17.797C30.5093 14.9068 34.1575 11.9874 33.8853 8.32577C33.682 5.5954 31.1984 3.25271 28.3707 3.27012C26.9806 3.29623 25.6261 3.85876 24.6269 4.82084C22.9464 6.48232 20.9471 8.16437 19.3394 9.90101L17.0553 7.61687Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Order:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 49 53"
          fill="none">
          <Path
            d="M37.2037 17.8457V0C37.2037 0 40.5176 -0.00161868 42.0432 1.20988C43.2492 2.16765 44.1604 4.53704 44.1604 4.53704V21.4753L18.753 46.8827V52.0247H8.16662C8.16662 52.0247 7.25921 52.0247 5.44439 50.2099L3.62958 48.3951V43.858H8.16662V38.716H3.62958V28.7346H8.16662V23.2901H3.62958V13.0062H8.16662V7.56173H3.62958C3.62958 7.56173 3.4023 5.69618 3.62958 4.53704C3.82377 3.54666 3.9856 2.96258 4.53699 2.11728C5.223 1.0656 6.95674 0 6.95674 0H24.8024V17.8457L30.5493 14.5185L37.2037 17.8457Z"
            fill={props.color}
          />
          <Path
            d="M44.4629 36.2962L39.321 30.8518L24.1975 46.8826L24.8024 51.1172L29.037 51.4197L44.4629 36.2962Z"
            fill={props.color}
          />
          <Path
            d="M41.4382 29.6419L45.6728 34.1789L49 30.8518L44.4629 26.6172L41.4382 29.6419Z"
            fill={props.color}
          />
          <Rect
            y="7.25928"
            width="4.23457"
            height="6.04938"
            fill={props.color}
          />
          <Rect
            y="22.9878"
            width="4.23457"
            height="6.04938"
            fill={props.color}
          />
          <Rect
            y="38.1113"
            width="4.23457"
            height="6.04938"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Group232:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 13 11"
          fill="none">
          <Path
            d="M1.04735 4.70947H11.5109C11.6497 4.70947 11.7827 4.76459 11.8809 4.86271C11.979 4.96082 12.0341 5.0939 12.0341 5.23265C12.0341 5.37141 11.979 5.50448 11.8809 5.60259C11.7827 5.70071 11.6497 5.75583 11.5109 5.75583H1.04735C0.908593 5.75583 0.77552 5.70071 0.677405 5.60259C0.57929 5.50448 0.52417 5.37141 0.52417 5.23265C0.52417 5.0939 0.57929 4.96082 0.677405 4.86271C0.77552 4.76459 0.908593 4.70947 1.04735 4.70947Z"
            fill={props.color}
          />
          <Path
            d="M1.26389 5.23244L5.60313 9.57064C5.70137 9.66888 5.75656 9.80212 5.75656 9.94105C5.75656 10.08 5.70137 10.2132 5.60313 10.3115C5.50489 10.4097 5.37165 10.4649 5.23272 10.4649C5.09379 10.4649 4.96055 10.4097 4.86231 10.3115L0.153703 5.60285C0.104981 5.55425 0.0663262 5.49652 0.0399513 5.43296C0.0135763 5.3694 0 5.30126 0 5.23244C0 5.16363 0.0135763 5.09549 0.0399513 5.03193C0.0663262 4.96837 0.104981 4.91063 0.153703 4.86203L4.86231 0.153429C4.96055 0.0551899 5.09379 0 5.23272 0C5.37165 0 5.50489 0.0551899 5.60313 0.153429C5.70137 0.251668 5.75656 0.384908 5.75656 0.523839C5.75656 0.66277 5.70137 0.79601 5.60313 0.894249L1.26389 5.23244Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.PasswordKey1:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 17 7"
          fill="none">
          <Circle
            cx="3.5"
            cy="3.5"
            r="2.5"
            stroke={props.color}
            strokeWidth="2"
          />
          <Rect x="5" y="2" width="12" height="2" fill={props.color} />
          <Rect x="13" y="2" width="2" height="4" fill={props.color} />
        </Svg>
      );

    case CustomIcons.Group245:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 31 12"
          fill="none">
          <Path
            d="M22.8571 1.71502V0.428541C22.8571 0.314885 22.9023 0.205884 22.9827 0.125517C23.063 0.0451497 23.172 0 23.2857 0H26.7143C26.828 0 26.937 0.0451497 27.0173 0.125517C27.0977 0.205884 27.1429 0.314885 27.1429 0.428541V1.71502H30.5714C30.6851 1.71502 30.7941 1.76017 30.8745 1.84054C30.9548 1.9209 31 2.0299 31 2.14356C31 2.25722 30.9548 2.36622 30.8745 2.44658C30.7941 2.52695 30.6851 2.5721 30.5714 2.5721H19.4286C19.3149 2.5721 19.2059 2.52695 19.1255 2.44658C19.0452 2.36622 19 2.25722 19 2.14356C19 2.0299 19.0452 1.9209 19.1255 1.84054C19.2059 1.76017 19.3149 1.71502 19.4286 1.71502H22.8571ZM23.7143 1.71502H26.2857V0.857939H23.7143V1.71502ZM20.7143 12C20.6006 12 20.4916 11.9549 20.4112 11.8745C20.3309 11.7941 20.2857 11.6851 20.2857 11.5715V2.5721H29.7143V11.5715C29.7143 11.6851 29.6691 11.7941 29.5888 11.8745C29.5084 11.9549 29.3994 12 29.2857 12H20.7143ZM23.7143 9.42875C23.828 9.42875 23.937 9.38361 24.0173 9.30324C24.0977 9.22287 24.1429 9.11387 24.1429 9.00021V4.71481C24.1429 4.60115 24.0977 4.49215 24.0173 4.41178C23.937 4.33141 23.828 4.28626 23.7143 4.28626C23.6006 4.28626 23.4916 4.33141 23.4112 4.41178C23.3309 4.49215 23.2857 4.60115 23.2857 4.71481V9.00021C23.2857 9.11387 23.3309 9.22287 23.4112 9.30324C23.4916 9.38361 23.6006 9.42875 23.7143 9.42875ZM26.2857 9.42875C26.3994 9.42875 26.5084 9.38361 26.5888 9.30324C26.6691 9.22287 26.7143 9.11387 26.7143 9.00021V4.71481C26.7143 4.60115 26.6691 4.49215 26.5888 4.41178C26.5084 4.33141 26.3994 4.28626 26.2857 4.28626C26.172 4.28626 26.063 4.33141 25.9827 4.41178C25.9023 4.49215 25.8571 4.60115 25.8571 4.71481V9.00021C25.8571 9.11387 25.9023 9.22287 25.9827 9.30324C26.063 9.38361 26.172 9.42875 26.2857 9.42875Z"
            fill={props.color}
          />
          <Path
            d="M8.51824 0H3.48774C1.30265 0 0 1.302 0 3.486V8.508C0 10.698 1.30265 12 3.48774 12H8.51224C10.6973 12 12 10.698 12 8.514V3.486C12.006 1.302 10.7033 0 8.51824 0ZM8.87242 4.62L5.46872 8.022C5.38468 8.106 5.27063 8.154 5.15057 8.154C5.03051 8.154 4.91645 8.106 4.83241 8.022L3.13356 6.324C2.95947 6.15 2.95947 5.862 3.13356 5.688C3.30765 5.514 3.59579 5.514 3.76988 5.688L5.15057 7.068L8.2361 3.984C8.41019 3.81 8.69833 3.81 8.87242 3.984C9.04651 4.158 9.04651 4.44 8.87242 4.62Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Fingerprint:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 30 34"
          fill="none">
          <Path
            d="M1.07394 13.0828C0.884162 13.0845 0.697305 13.036 0.532348 12.9421C0.411357 12.8741 0.305143 12.7826 0.219923 12.6731C0.134703 12.5635 0.0721868 12.4381 0.0360332 12.3041C-0.000120352 12.1701 -0.00918554 12.0302 0.00936811 11.8927C0.0279218 11.7551 0.0737218 11.6226 0.144088 11.503C1.50019 9.23956 5.62616 3.95654 14.6293 3.95654C18.5309 3.95654 21.9528 4.98135 24.7951 7.00143C27.1345 8.65928 28.4456 10.5359 29.0702 11.4397C29.1494 11.5536 29.205 11.6823 29.2338 11.818C29.2625 11.9537 29.2639 12.0939 29.2376 12.2301C29.2114 12.3664 29.1582 12.496 29.0811 12.6114C29.0041 12.7268 28.9047 12.8256 28.7888 12.902C28.5521 13.0585 28.2637 13.1167 27.9848 13.0641C27.706 13.0116 27.4585 12.8525 27.2949 12.6207C26.1646 10.9952 22.7181 6.04907 14.6293 6.04907C6.73396 6.04907 3.16436 10.6006 2.00169 12.5524C1.90827 12.7154 1.77302 12.8505 1.60993 12.9438C1.44683 13.037 1.2618 13.085 1.07394 13.0828Z"
            fill={props.color}
          />
          <Path
            d="M19.1653 33.762C19.0755 33.7631 18.986 33.7529 18.8987 33.7318C12.3679 32.114 9.92934 25.5854 9.83016 25.3139L9.81469 25.2541C9.76123 25.0656 8.45085 20.5886 10.4625 17.9664C11.3846 16.7707 12.7871 16.1574 14.6391 16.1574C16.361 16.1574 17.6031 16.6926 18.457 17.8005C19.1604 18.705 19.4417 19.8205 19.7139 20.8953C20.2858 23.1334 20.6986 24.3087 23.0753 24.4297C24.1191 24.4825 24.8049 23.8719 25.1939 23.3522C26.2454 21.9349 26.4283 19.6243 25.6356 17.5845C24.6171 14.9518 21.0025 9.98812 14.6293 9.98812C11.9086 9.98812 9.40884 10.8624 7.40424 12.5055C5.74499 13.8665 4.43039 15.7881 3.79736 17.7632C2.62343 21.4404 4.16311 27.2207 4.17788 27.2734C4.21383 27.408 4.22248 27.5483 4.20332 27.6863C4.18416 27.8242 4.13758 27.9569 4.06632 28.0765C3.99506 28.1962 3.90057 28.3003 3.78842 28.3828C3.67627 28.4654 3.54873 28.5246 3.41332 28.5571C3.13975 28.6298 2.84857 28.5925 2.60218 28.4532C2.35579 28.3138 2.1738 28.0835 2.0952 27.8115C2.02486 27.5478 0.380383 21.3827 1.73648 17.133C3.21356 12.528 7.7721 7.88574 14.6314 7.88574C17.8015 7.88574 20.7964 8.96331 23.2962 10.9982C25.2319 12.5807 26.813 14.7063 27.6402 16.8312C28.6917 19.5441 28.4097 22.589 26.9235 24.5781C25.9331 25.9047 24.5229 26.5982 22.9607 26.5229C18.891 26.319 18.1595 23.4781 17.6263 21.4059C17.0777 19.2803 16.7267 18.2555 14.6314 18.2555C13.4807 18.2555 12.6725 18.572 12.1696 19.2276C11.4838 20.1244 11.4303 21.5262 11.5063 22.5433C11.5562 23.2519 11.6763 23.9538 11.865 24.6386C12.0324 25.0606 14.2122 30.4063 19.4326 31.6998C19.5675 31.7317 19.6947 31.7902 19.8069 31.8717C19.919 31.9533 20.0138 32.0563 20.0858 32.1748C20.1578 32.2934 20.2055 32.425 20.2262 32.5621C20.2469 32.6992 20.2401 32.8391 20.2063 32.9736C20.1426 33.2006 20.0064 33.4005 19.8184 33.5429C19.6304 33.6852 19.4011 33.7622 19.1653 33.762Z"
            fill={props.color}
          />
          <Path
            d="M10.7825 33.2791C10.6361 33.2794 10.4911 33.2503 10.3563 33.1933C10.2214 33.1364 10.0994 33.0529 9.9975 32.9478C7.38378 30.2047 5.90529 27.1373 5.34893 23.3018V23.2814C5.03663 20.7423 5.49382 17.1473 7.73406 14.6757C9.38768 12.8518 11.7123 11.9248 14.6313 11.9248C18.0834 11.9248 20.7963 13.5299 22.488 16.5593C23.7153 18.7602 23.9587 20.9533 23.965 21.0433C23.9779 21.1821 23.9633 21.3221 23.9219 21.4552C23.8806 21.5884 23.8135 21.7121 23.7243 21.8192C23.6351 21.9264 23.5257 22.0149 23.4022 22.0797C23.2788 22.1445 23.1438 22.1843 23.0049 22.1968C22.7248 22.2272 22.4439 22.1462 22.223 21.9713C22.002 21.7965 21.8587 21.5417 21.824 21.262C21.6387 19.9461 21.2129 18.6756 20.5677 17.5138C19.2567 15.2004 17.2619 14.0244 14.6236 14.0244C12.3446 14.0244 10.5616 14.7102 9.33493 16.0641C7.56665 18.016 7.22481 21.0229 7.46748 23.012C7.95491 26.4037 9.25826 29.1018 11.5597 31.513C11.6557 31.6129 11.7307 31.7311 11.7802 31.8606C11.8296 31.9901 11.8525 32.1282 11.8476 32.2667C11.8426 32.4052 11.8098 32.5413 11.7511 32.6669C11.6925 32.7925 11.6092 32.905 11.5062 32.9978C11.3079 33.1776 11.0501 33.2778 10.7825 33.2791Z"
            fill={props.color}
          />
          <Path
            d="M22.8235 30.2577C20.5376 30.2577 18.5941 29.6247 17.039 28.3664C13.9146 25.849 13.5643 21.7491 13.5489 21.576C13.5269 21.292 13.6186 21.0109 13.8038 20.7945C13.9891 20.5781 14.2527 20.4442 14.5368 20.4222C14.8208 20.4001 15.1019 20.4919 15.3183 20.6771C15.5347 20.8624 15.6686 21.126 15.6906 21.41C15.6984 21.4705 16.0107 24.8242 18.419 26.7557C19.844 27.8937 21.7488 28.3453 24.0959 28.0815C24.3764 28.0475 24.659 28.1259 24.8819 28.2996C25.1048 28.4733 25.2498 28.7282 25.2853 29.0086C25.3007 29.147 25.2883 29.2872 25.2489 29.4209C25.2095 29.5545 25.1439 29.679 25.0559 29.787C24.9679 29.895 24.8593 29.9845 24.7364 30.0501C24.6135 30.1157 24.4787 30.1561 24.34 30.1691C23.8366 30.2278 23.3303 30.2574 22.8235 30.2577Z"
            fill={props.color}
          />
          <Path
            d="M24.6299 2.30635C23.738 1.72607 20.5757 0 14.6294 0C8.38769 0 5.2176 1.90684 4.51634 2.39146C4.47002 2.41989 4.42667 2.45288 4.38692 2.48993C4.38272 2.49399 4.37726 2.49647 4.37144 2.49696C4.25946 2.59474 4.16961 2.71526 4.10787 2.85049C4.04614 2.98572 4.01394 3.13257 4.01343 3.28122C4.01535 3.42057 4.04475 3.55817 4.09995 3.68614C4.15515 3.81411 4.23505 3.92993 4.33509 4.02696C4.43513 4.12399 4.55333 4.20032 4.68292 4.25159C4.81251 4.30286 4.95094 4.32805 5.09029 4.32573C5.31363 4.32558 5.53158 4.2571 5.71488 4.12949C5.74513 4.10698 8.4735 2.10237 14.6315 2.10237C20.7895 2.10237 23.5327 4.09995 23.5622 4.11472C23.7495 4.25358 23.9769 4.32766 24.21 4.32573C24.3495 4.32787 24.488 4.30244 24.6176 4.25091C24.7472 4.19939 24.8654 4.12277 24.9653 4.02546C25.0652 3.92815 25.1449 3.81206 25.1999 3.68386C25.2548 3.55567 25.2839 3.41788 25.2855 3.27841C25.2855 3.0695 25.2231 2.86534 25.1063 2.69213C24.9895 2.51893 24.8236 2.38459 24.6299 2.30635Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Email:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 50 40"
          fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.92005 1.08167e-06H40.08C41.1765 -2.39183e-05 42.1227 -4.91505e-05 42.906 0.0533758C43.7305 0.109651 44.5552 0.233402 45.3703 0.570902C47.2077 1.3321 48.668 2.79218 49.429 4.62988C49.7665 5.4447 49.8903 6.26948 49.9468 7.09405C50 7.8772 50 8.8234 50 9.92003V30.08C50 31.1765 50 32.1227 49.9468 32.906C49.8903 33.7305 49.7665 34.5552 49.429 35.3703C48.668 37.2077 47.2077 38.668 45.3703 39.429C44.5552 39.7665 43.7305 39.8903 42.906 39.9468C42.1227 40 41.1765 40 40.08 40H9.92003C8.8234 40 7.8772 40 7.09405 39.9468C6.26948 39.8903 5.4447 39.7665 4.62988 39.429C2.79218 38.668 1.3321 37.2077 0.570901 35.3703C0.233401 34.5552 0.109651 33.7305 0.0533758 32.906C-4.91505e-05 32.1227 -2.39183e-05 31.1765 1.08167e-06 30.08V9.92005C-2.39183e-05 8.82343 -4.91505e-05 7.8772 0.0533758 7.09405C0.109651 6.26948 0.233401 5.4447 0.570901 4.62988C1.3321 2.79218 2.79218 1.3321 4.62988 0.570902C5.4447 0.233402 6.26948 0.109651 7.09405 0.0533758C7.8772 -4.91505e-05 8.82343 -2.39183e-05 9.92005 1.08167e-06ZM5.79363 5.69443C6.70285 4.65535 8.28225 4.55005 9.32135 5.45925L23.3538 17.7375C24.2963 18.5623 25.7037 18.5623 26.6462 17.7375L40.6787 5.45925C41.7178 4.55005 43.2973 4.65535 44.2063 5.69443C45.1155 6.73353 45.0102 8.31293 43.9712 9.22213L29.9388 21.5005C27.111 23.9747 22.889 23.9747 20.0612 21.5005L6.02883 9.22213C4.98973 8.31293 4.88443 6.73353 5.79363 5.69443Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Information:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 28 28"
          fill="none">
          <Path
            d="M12.6667 12.6667H14V20M14 20H16M14 20H12M26 14C26 15.5759 25.6896 17.1363 25.0866 18.5922C24.4835 20.0481 23.5996 21.371 22.4853 22.4853C21.371 23.5996 20.0481 24.4835 18.5922 25.0866C17.1363 25.6896 15.5759 26 14 26C12.4241 26 10.8637 25.6896 9.4078 25.0866C7.95189 24.4835 6.62902 23.5996 5.51472 22.4853C4.40042 21.371 3.5165 20.0481 2.91345 18.5922C2.31039 17.1363 2 15.5759 2 14C2 10.8174 3.26428 7.76516 5.51472 5.51472C7.76515 3.26428 10.8174 2 14 2C17.1826 2 20.2348 3.26428 22.4853 5.51472C24.7357 7.76516 26 10.8174 26 14ZM13.3333 8.66667V8H14V8.66667H13.3333Z"
            stroke={props.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.Male:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 24"
          fill="none">
          <Mask
            id="mask0_58_1853"
            style={{maskType: 'alpha'}}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={props.size}
            height={props.size}>
            <Rect width="24" height={props.size} fill={props.color} />
          </Mask>
          <G Mask="url(#mask0_58_1853)">
            <Path
              d="M11.1429 19.697H9.71427C9.47142 19.697 9.26785 19.6142 9.10359 19.4486C8.9393 19.283 8.85716 19.0778 8.85716 18.833C8.85716 18.5882 8.9393 18.3831 9.10359 18.2177C9.26785 18.0524 9.47142 17.9697 9.71427 17.9697H11.1429V15.02C9.66009 14.803 8.43225 14.1265 7.45935 12.9905C6.48645 11.8545 6 10.5276 6 9.01001C6 7.3375 6.58498 5.91771 7.75495 4.75063C8.9249 3.58354 10.3399 3 12 3C13.6601 3 15.0751 3.58354 16.245 4.75063C17.415 5.91771 18 7.3375 18 9.01001C18 10.5276 17.5135 11.8545 16.5407 12.9905C15.5677 14.1265 14.3399 14.803 12.8571 15.02V17.9697H14.2857C14.5286 17.9697 14.7322 18.0525 14.8964 18.2181C15.0607 18.3837 15.1428 18.5889 15.1428 18.8337C15.1428 19.0785 15.0607 19.2836 14.8964 19.449C14.7322 19.6143 14.5286 19.697 14.2857 19.697H12.8571V21.1364C12.8571 21.3811 12.7749 21.5862 12.6106 21.7517C12.4462 21.9172 12.2426 22 11.9996 22C11.7567 22 11.5531 21.9172 11.389 21.7517C11.2249 21.5862 11.1429 21.3811 11.1429 21.1364V19.697ZM12.0018 13.3637C13.1859 13.3637 14.196 12.942 15.0319 12.0985C15.8678 11.2551 16.2858 10.2368 16.2858 9.04366C16.2858 7.85051 15.8672 6.83282 15.0301 5.99058C14.193 5.14834 13.1824 4.72722 11.9982 4.72722C10.8141 4.72722 9.80401 5.14894 8.9681 5.99237C8.13219 6.83579 7.71424 7.85408 7.71424 9.04723C7.71424 10.2404 8.13278 11.2581 8.96987 12.1003C9.80696 12.9425 10.8176 13.3637 12.0018 13.3637Z"
              fill={props.color}
            />
          </G>
        </Svg>
      );

    case CustomIcons.Menu:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 24"
          fill="none">
          <Path
            d="M4 6H20M4 12H20M4 18H20"
            stroke={props.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.Page1:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 28 28"
          fill="none">
          <Path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M28 24.8433V27.4584H21.4623V24.8433H28ZM20.1547 24.8433V27.4584H17.5397V24.8433H20.1547ZM28 20.9207V23.5358H21.4623V20.9207H28ZM20.1547 20.9207V23.5358H17.5397V20.9207H20.1547ZM8.0696 16.0078C9.48931 17.4275 11.4506 18.3056 13.617 18.3056C14.534 18.3056 15.4142 18.1483 16.2322 17.8592L16.2322 20.5911C15.3964 20.8063 14.5201 20.9207 13.617 20.9207C10.7285 20.9207 8.11335 19.7498 6.22039 17.8569L8.0696 16.0078ZM28 16.9981V19.6131H21.4623V16.9981H28ZM20.1547 16.9981V19.6131H17.5397V16.9981H20.1547ZM13.617 0C19.3941 0 24.0774 4.68325 24.0774 10.4603C24.0774 12.3656 23.568 14.152 22.6779 15.6906L19.4645 15.6907C20.7068 14.3027 21.4623 12.4697 21.4623 10.4603C21.4623 6.12753 17.9498 2.61509 13.617 2.61509C9.28421 2.61509 5.77177 6.12753 5.77177 10.4603C5.77177 10.7071 5.78316 10.9512 5.80545 11.1921L7.07932 9.91874L8.92846 11.7679L4.46423 16.2321L0 11.7679L1.84914 9.91874L3.18647 11.2556C3.16673 10.9931 3.15669 10.7279 3.15669 10.4603C3.15669 4.68325 7.83994 0 13.617 0ZM14.9246 3.92263V9.75427L18.2588 11.9902L16.8205 14.1607L12.3095 11.1664V3.92263H14.9246Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Set:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 24"
          fill="none">
          <Mask
            id="mask0_58_1856"
            style={{maskType: 'alpha'}}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={props.size}
            height={props.size}>
            <Rect
              y="24"
              width={props.size}
              height={props.size}
              transform="rotate(-90 0 24)"
              fill={props.color}
            />
          </Mask>
          <G Mask="url(#mask0_58_1856)">
            <Path
              d="M20.75 12.0003C20.75 12.2129 20.6781 12.391 20.5343 12.5346C20.3906 12.6782 20.2125 12.75 20 12.75L16 12.75C15.7875 12.75 15.6094 12.6781 15.4656 12.5343C15.3219 12.3905 15.25 12.2123 15.25 11.9997C15.25 11.7871 15.3219 11.609 15.4656 11.4654C15.6094 11.3218 15.7875 11.25 16 11.25L17.25 11.25L17.25 4.00002C17.25 3.78752 17.3219 3.6094 17.4657 3.46565C17.6095 3.32191 17.7877 3.25005 18.0003 3.25005C18.2129 3.25005 18.391 3.32191 18.5346 3.46565C18.6782 3.6094 18.75 3.78752 18.75 4.00002L18.75 11.25L20 11.25C20.2125 11.25 20.3906 11.3219 20.5343 11.4657C20.6781 11.6096 20.75 11.7878 20.75 12.0003ZM18.75 20C18.75 20.2125 18.6781 20.3906 18.5343 20.5344C18.3904 20.6781 18.2122 20.75 17.9997 20.75C17.7871 20.75 17.609 20.6781 17.4654 20.5344C17.3218 20.3906 17.25 20.2125 17.25 20L17.25 16C17.25 15.7875 17.3219 15.6094 17.4657 15.4657C17.6095 15.3219 17.7877 15.25 18.0003 15.25C18.2129 15.25 18.391 15.3219 18.5346 15.4657C18.6782 15.6094 18.75 15.7875 18.75 16L18.75 20ZM14.75 16.0003C14.75 16.2129 14.6781 16.391 14.5343 16.5346C14.3906 16.6782 14.2125 16.75 14 16.75L12.75 16.75L12.75 20C12.75 20.2125 12.6781 20.3906 12.5343 20.5344C12.3904 20.6781 12.2122 20.75 11.9997 20.75C11.7871 20.75 11.609 20.6781 11.4654 20.5344C11.3218 20.3906 11.25 20.2125 11.25 20L11.25 16.75L9.99998 16.75C9.78748 16.75 9.60935 16.6781 9.4656 16.5343C9.32187 16.3905 9.25 16.2123 9.25 15.9997C9.25 15.7871 9.32187 15.609 9.4656 15.4654C9.60935 15.3218 9.78748 15.25 9.99998 15.25L14 15.25C14.2125 15.25 14.3906 15.3219 14.5343 15.4657C14.6781 15.6096 14.75 15.7878 14.75 16.0003ZM12.75 12C12.75 12.2125 12.6781 12.3906 12.5343 12.5344C12.3904 12.6781 12.2122 12.75 11.9997 12.75C11.7871 12.75 11.609 12.6781 11.4654 12.5344C11.3218 12.3906 11.25 12.2125 11.25 12L11.25 4.00002C11.25 3.78752 11.3219 3.6094 11.4657 3.46565C11.6095 3.32191 11.7877 3.25005 12.0003 3.25005C12.2129 3.25005 12.391 3.32191 12.5346 3.46565C12.6782 3.6094 12.75 3.78752 12.75 4.00002L12.75 12ZM8.74995 8.00035C8.74995 8.21295 8.67808 8.39104 8.53435 8.53462C8.3906 8.67821 8.21248 8.75 7.99998 8.75L3.99998 8.75C3.78748 8.75 3.60935 8.6781 3.4656 8.5343C3.32187 8.39048 3.25 8.21228 3.25 7.9997C3.25 7.7871 3.32187 7.60901 3.4656 7.46543C3.60935 7.32184 3.78748 7.25005 3.99998 7.25005L5.25 7.25005L5.25 4.00002C5.25 3.78752 5.3219 3.6094 5.4657 3.46565C5.60952 3.32191 5.78772 3.25005 6.0003 3.25005C6.2129 3.25005 6.39099 3.32191 6.53457 3.46565C6.67816 3.6094 6.74995 3.78752 6.74995 4.00002L6.74995 7.25005L7.99998 7.25005C8.21248 7.25005 8.3906 7.32195 8.53435 7.46575C8.67808 7.60957 8.74995 7.78777 8.74995 8.00035ZM6.74995 20C6.74995 20.2125 6.67805 20.3906 6.53425 20.5344C6.39043 20.6781 6.21223 20.75 5.99965 20.75C5.78705 20.75 5.60896 20.6781 5.46538 20.5344C5.32179 20.3906 5.25 20.2125 5.25 20L5.25 12C5.25 11.7875 5.3219 11.6094 5.4657 11.4657C5.60952 11.3219 5.78772 11.25 6.0003 11.25C6.2129 11.25 6.39099 11.3219 6.53457 11.4657C6.67816 11.6094 6.74995 11.7875 6.74995 12L6.74995 20Z"
              fill={props.color}
            />
          </G>
        </Svg>
      );

    case CustomIcons.Home:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 60 60"
          fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M31.4192 1.41438C30.6382 0.633254 29.3718 0.633216 28.5907 1.4143L2.10938 27.8956C1.42793 28.5771 1.42871 29.6821 2.11112 30.3626C2.79216 31.0418 3.89456 31.041 4.57464 30.3609L28.5908 6.34474C29.3718 5.5637 30.6382 5.5637 31.4192 6.34474L55.4353 30.3609C56.1153 31.0408 57.2176 31.0412 57.8981 30.3617C58.5792 29.6816 58.5796 28.578 57.899 27.8973L31.4192 1.41438ZM50.9264 32.1044C49.9635 32.1044 49.1829 32.885 49.1829 33.8478V54.5131C49.1829 55.6176 48.2875 56.5131 47.1829 56.5131H40.7185C39.614 56.5131 38.7185 55.6176 38.7185 54.5131V41.0783C38.7185 39.9737 37.8231 39.0783 36.7185 39.0783H23.2873C22.1827 39.0783 21.2873 39.9737 21.2873 41.0783V54.513C21.2873 55.6176 20.3919 56.513 19.2873 56.513H12.8264C11.7218 56.513 10.8264 55.6176 10.8264 54.513V33.8496C10.8264 32.8857 10.045 32.1044 9.08119 32.1044C8.11733 32.1044 7.33597 32.8857 7.33597 33.8496V58C7.33597 59.1046 8.2314 60 9.33597 60H50.6698C51.7744 60 52.6698 59.1046 52.6698 58V33.8478C52.6698 32.885 51.8893 32.1044 50.9264 32.1044ZM33.2351 42.5653C34.3397 42.5653 35.2351 43.4607 35.2351 44.5653V54.5165C35.2351 55.6211 34.3397 56.5165 33.2351 56.5165H26.7742C25.6696 56.5165 24.7742 55.6211 24.7742 54.5165V44.5653C24.7742 43.4607 25.6696 42.5653 26.7742 42.5653H33.2351Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Passwordnotvisible:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 60 54"
          fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M35.2168 8.36101C33.5435 8.12034 31.8046 8 30 8C27.56 8 25.24 8.22 23.04 8.66C20.84 9.1 18.86 9.66 17.1 10.34C15.34 11.02 13.72 11.86 12.24 12.86C10.76 13.86 9.42 14.84 8.22 15.8C7.02 16.76 5.98 17.8 5.1 18.92C4.22 20.04 3.44 21.02 2.76 21.86C2.08 22.7 1.56 23.54 1.2 24.38C0.84 25.22 0.54 25.8 0.3 26.12L0 26.72C0.08 26.88 0.18 27.1 0.3 27.38C0.42 27.66 0.72 28.24 1.2 29.12C1.68 30 2.2 30.84 2.76 31.64C3.32 32.44 4.1 33.4 5.1 34.52C6.1 35.64 7.14 36.7 8.22 37.7C9.3 38.7 10.64 39.68 12.24 40.64C13.7351 41.537 15.2651 42.3293 16.83 43.0168L21.5161 34.1844C19.6183 32.1212 18.7063 29.633 18.78 26.72C18.78 23.64 19.86 21 22.02 18.8C24.18 16.6 26.84 15.5 30 15.5C30.4745 15.5 30.9377 15.5248 31.3897 15.5744L35.2168 8.36101ZM27.9635 37.8082C28.6206 37.927 29.2994 37.9909 30 38C33.08 38.04 35.74 36.94 37.98 34.7C40.22 32.46 41.32 29.8 41.28 26.72C41.2403 23.6611 40.155 21.0363 38.0243 18.8453L42.5888 10.2422C42.6731 10.2745 42.7568 10.3071 42.84 10.34C44.56 11.02 46.2 11.86 47.76 12.86C49.32 13.86 50.66 14.84 51.78 15.8C52.9 16.76 53.94 17.8 54.9 18.92C55.86 20.04 56.64 21.02 57.24 21.86C57.84 22.7 58.36 23.54 58.8 24.38C59.24 25.22 59.54 25.78 59.7 26.06C59.86 26.34 59.96 26.56 60 26.72L59.7 27.38C59.5 27.9 59.2 28.48 58.8 29.12C58.4 29.76 57.88 30.58 57.24 31.58C56.6 32.58 55.82 33.58 54.9 34.58C53.98 35.58 52.94 36.6 51.78 37.64C50.62 38.68 49.28 39.68 47.76 40.64C46.24 41.6 44.62 42.42 42.9 43.1C41.18 43.78 39.2 44.36 36.96 44.84C34.72 45.32 32.4 45.54 30 45.5C27.9895 45.4665 26.0351 45.3067 24.1369 45.0205L27.9635 37.8082Z"
            fill={props.color}
          />
          <Rect
            x="41.1833"
            width="5"
            height="58"
            transform="rotate(27.9485 41.1833 0)"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Passwordvisible:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 60 38"
          fill="none">
          <Path
            d="M0 18.72C0.08 18.88 0.18 19.1 0.3 19.38C0.42 19.66 0.72 20.24 1.2 21.12C1.68 22 2.2 22.84 2.76 23.64C3.32 24.44 4.1 25.4 5.1 26.52C6.1 27.64 7.14 28.7 8.22 29.7C9.3 30.7 10.64 31.68 12.24 32.64C13.84 33.6 15.48 34.44 17.16 35.16C18.84 35.88 20.8 36.44 23.04 36.84C25.28 37.24 27.6 37.46 30 37.5C32.4 37.54 34.72 37.32 36.96 36.84C39.2 36.36 41.18 35.78 42.9 35.1C44.62 34.42 46.24 33.6 47.76 32.64C49.28 31.68 50.62 30.68 51.78 29.64C52.94 28.6 53.98 27.58 54.9 26.58C55.82 25.58 56.6 24.58 57.24 23.58C57.88 22.58 58.4 21.76 58.8 21.12C59.2 20.48 59.5 19.9 59.7 19.38L60 18.72C59.96 18.56 59.86 18.34 59.7 18.06C59.54 17.78 59.24 17.22 58.8 16.38C58.36 15.54 57.84 14.7 57.24 13.86C56.64 13.02 55.86 12.04 54.9 10.92C53.94 9.8 52.9 8.76 51.78 7.8C50.66 6.84 49.32 5.86 47.76 4.86C46.2 3.86 44.56 3.02 42.84 2.34C41.12 1.66 39.16 1.1 36.96 0.66C34.76 0.22 32.44 0 30 0C27.56 0 25.24 0.22 23.04 0.66C20.84 1.1 18.86 1.66 17.1 2.34C15.34 3.02 13.72 3.86 12.24 4.86C10.76 5.86 9.42 6.84 8.22 7.8C7.02 8.76 5.98 9.8 5.1 10.92C4.22 12.04 3.44 13.02 2.76 13.86C2.08 14.7 1.56 15.54 1.2 16.38C0.84 17.22 0.54 17.8 0.3 18.12L0 18.72ZM18.78 18.72C18.78 15.64 19.86 13 22.02 10.8C24.18 8.6 26.84 7.5 30 7.5C33.16 7.5 35.82 8.6 37.98 10.8C40.14 13 41.24 15.64 41.28 18.72C41.32 21.8 40.22 24.46 37.98 26.7C35.74 28.94 33.08 30.04 30 30C26.92 29.96 24.26 28.86 22.02 26.7C19.78 24.54 18.7 21.88 18.78 18.72Z"
            fill={props.color}
          />
          <Circle cx="30" cy="19" r="7" fill={props.color} />
        </Svg>
      );

    case CustomIcons.History:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 20 20"
          fill="none">
          <Path
            d="M10.0263 5.01779C9.80478 5.01779 9.59234 5.1059 9.4357 5.26274C9.27907 5.41957 9.19107 5.63229 9.19107 5.85409V10.0356C9.19112 10.2574 9.27915 10.47 9.43579 10.6268L11.9415 13.1357C12.099 13.2881 12.31 13.3724 12.529 13.3705C12.748 13.3686 12.9574 13.2806 13.1123 13.1255C13.2672 12.9705 13.355 12.7607 13.3569 12.5415C13.3588 12.3222 13.2746 12.1109 13.1225 11.9532L10.8615 9.68935V5.85409C10.8615 5.63229 10.7735 5.41957 10.6169 5.26274C10.4603 5.1059 10.2478 5.01779 10.0263 5.01779ZM19.892 8.47337C19.6053 6.65512 18.8246 4.95086 17.6355 3.54704C16.4463 2.14323 14.8944 1.09394 13.1497 0.513988C11.4049 -0.0659643 9.5344 -0.15424 7.74287 0.258819C5.95134 0.671878 4.30779 1.57036 2.99203 2.85596V0.836298C2.99203 0.614498 2.90403 0.401782 2.7474 0.244946C2.59076 0.0881097 2.37832 0 2.15681 0C1.93529 0 1.72285 0.0881097 1.56621 0.244946C1.40958 0.401782 1.32158 0.614498 1.32158 0.836298V4.18149C1.32158 4.62509 1.49757 5.05052 1.81084 5.3642C2.12411 5.67787 2.549 5.85409 2.99203 5.85409H6.33293C6.55445 5.85409 6.76689 5.76598 6.92352 5.60914C7.08016 5.4523 7.16816 5.23959 7.16816 5.01779C7.16816 4.79599 7.08016 4.58327 6.92352 4.42644C6.76689 4.2696 6.55445 4.18149 6.33293 4.18149H4.03523C5.36992 2.82471 7.1275 1.96522 9.01677 1.74543C10.906 1.52564 12.8136 1.95875 14.4234 2.97299C16.0332 3.98722 17.2487 5.52172 17.8684 7.32223C18.488 9.12275 18.4748 11.0812 17.8307 12.8731C17.1867 14.6651 15.9506 16.1829 14.3272 17.1752C12.7038 18.1675 10.7905 18.5746 8.9044 18.3292C7.01828 18.0837 5.2725 17.2004 3.95632 15.8257C2.64014 14.4509 1.83256 12.6671 1.66736 10.7698C1.64571 10.566 1.54869 10.3776 1.39537 10.2418C1.24206 10.1059 1.04353 10.0323 0.83882 10.0356C0.72201 10.0359 0.606545 10.0606 0.499784 10.108C0.393022 10.1555 0.297304 10.2247 0.218729 10.3112C0.140154 10.3978 0.080444 10.4998 0.0434041 10.6107C0.00636428 10.7216 -0.00719343 10.839 0.00359486 10.9555C0.135674 12.2881 0.532774 13.5807 1.1715 14.7573C1.81023 15.9338 2.67766 16.9704 3.7227 17.8061C4.76774 18.6418 5.96925 19.2596 7.25643 19.6231C8.54362 19.9867 9.89045 20.0886 11.2176 19.9229C12.5447 19.7571 13.8253 19.3272 14.9839 18.6582C16.1425 17.9893 17.1557 17.095 17.9637 16.0279C18.7718 14.9608 19.3584 13.7426 19.689 12.4451C20.0196 11.1475 20.0875 9.79679 19.8886 8.47254L19.892 8.47337Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Vector3:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 28 22"
          fill="none">
          <Path
            d="M8.66667 2.69324L26 2.69423M8.66667 11.001L26 11.0021M8.66667 19.3087L26 19.3098M2.66667 2.69231H2.68M2.66667 11H2.68M2.66667 19.3077H2.68M3.33333 2.69231C3.33333 3.07466 3.03485 3.38462 2.66667 3.38462C2.29848 3.38462 2 3.07466 2 2.69231C2 2.30996 2.29848 2 2.66667 2C3.03485 2 3.33333 2.30996 3.33333 2.69231ZM3.33333 11C3.33333 11.3823 3.03485 11.6923 2.66667 11.6923C2.29848 11.6923 2 11.3823 2 11C2 10.6177 2.29848 10.3077 2.66667 10.3077C3.03485 10.3077 3.33333 10.6177 3.33333 11ZM3.33333 19.3077C3.33333 19.69 3.03485 20 2.66667 20C2.29848 20 2 19.69 2 19.3077C2 18.9254 2.29848 18.6154 2.66667 18.6154C3.03485 18.6154 3.33333 18.9254 3.33333 19.3077Z"
            stroke={props.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.Vector4:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 28 28"
          fill="none">
          <Path
            d="M12.6667 12.6667H14V20M14 20H16M14 20H12M26 14C26 15.5759 25.6896 17.1363 25.0866 18.5922C24.4835 20.0481 23.5996 21.371 22.4853 22.4853C21.371 23.5996 20.0481 24.4835 18.5922 25.0866C17.1363 25.6896 15.5759 26 14 26C12.4241 26 10.8637 25.6896 9.4078 25.0866C7.95189 24.4835 6.62902 23.5996 5.51472 22.4853C4.40042 21.371 3.5165 20.0481 2.91345 18.5922C2.31039 17.1363 2 15.5759 2 14C2 10.8174 3.26428 7.76516 5.51472 5.51472C7.76515 3.26428 10.8174 2 14 2C17.1826 2 20.2348 3.26428 22.4853 5.51472C24.7357 7.76516 26 10.8174 26 14ZM13.3333 8.66667V8H14V8.66667H13.3333Z"
            stroke={props.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.Vector5:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 20 20"
          fill="none">
          <Path
            d="M10.0263 5.01779C9.80478 5.01779 9.59234 5.1059 9.4357 5.26274C9.27907 5.41957 9.19107 5.63229 9.19107 5.85409V10.0356C9.19112 10.2574 9.27915 10.47 9.43579 10.6268L11.9415 13.1357C12.099 13.2881 12.31 13.3724 12.529 13.3705C12.748 13.3686 12.9574 13.2806 13.1123 13.1255C13.2672 12.9705 13.355 12.7607 13.3569 12.5415C13.3588 12.3222 13.2746 12.1109 13.1225 11.9532L10.8615 9.68935V5.85409C10.8615 5.63229 10.7735 5.41957 10.6169 5.26274C10.4603 5.1059 10.2478 5.01779 10.0263 5.01779ZM19.892 8.47337C19.6053 6.65512 18.8246 4.95086 17.6355 3.54704C16.4463 2.14323 14.8944 1.09394 13.1497 0.513988C11.4049 -0.0659643 9.5344 -0.15424 7.74287 0.258819C5.95134 0.671878 4.30779 1.57036 2.99203 2.85596V0.836298C2.99203 0.614498 2.90403 0.401782 2.7474 0.244946C2.59076 0.0881097 2.37832 0 2.15681 0C1.93529 0 1.72285 0.0881097 1.56621 0.244946C1.40958 0.401782 1.32158 0.614498 1.32158 0.836298V4.18149C1.32158 4.62509 1.49757 5.05052 1.81084 5.3642C2.12411 5.67787 2.549 5.85409 2.99203 5.85409H6.33293C6.55445 5.85409 6.76689 5.76598 6.92352 5.60914C7.08016 5.4523 7.16816 5.23959 7.16816 5.01779C7.16816 4.79599 7.08016 4.58327 6.92352 4.42644C6.76689 4.2696 6.55445 4.18149 6.33293 4.18149H4.03523C5.36992 2.82471 7.1275 1.96522 9.01677 1.74543C10.906 1.52564 12.8136 1.95875 14.4234 2.97299C16.0332 3.98722 17.2487 5.52172 17.8684 7.32223C18.488 9.12275 18.4748 11.0812 17.8307 12.8731C17.1867 14.6651 15.9506 16.1829 14.3272 17.1752C12.7038 18.1675 10.7905 18.5746 8.9044 18.3292C7.01828 18.0837 5.2725 17.2004 3.95632 15.8257C2.64014 14.4509 1.83256 12.6671 1.66736 10.7698C1.64571 10.566 1.54869 10.3776 1.39537 10.2418C1.24206 10.1059 1.04353 10.0323 0.83882 10.0356C0.72201 10.0359 0.606545 10.0606 0.499784 10.108C0.393022 10.1555 0.297304 10.2247 0.218729 10.3112C0.140154 10.3978 0.080444 10.4998 0.0434041 10.6107C0.00636428 10.7216 -0.00719343 10.839 0.00359486 10.9555C0.135674 12.2881 0.532774 13.5807 1.1715 14.7573C1.81023 15.9338 2.67766 16.9704 3.7227 17.8061C4.76774 18.6418 5.96925 19.2596 7.25643 19.6231C8.54362 19.9867 9.89045 20.0886 11.2176 19.9229C12.5447 19.7571 13.8253 19.3272 14.9839 18.6582C16.1425 17.9893 17.1557 17.095 17.9637 16.0279C18.7718 14.9608 19.3584 13.7426 19.689 12.4451C20.0196 11.1475 20.0875 9.79679 19.8886 8.47254L19.892 8.47337Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Warning:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 26 24"
          fill="none">
          <Path
            d="M19.9023 21.9963H6.08633C5.37778 22.0268 4.67385 21.8682 4.04679 21.5369C3.41971 21.2056 2.89208 20.7135 2.51793 20.1111C2.14379 19.5086 1.93662 18.8174 1.91768 18.1085C1.89876 17.3995 2.06876 16.6984 2.41022 16.0768L9.31817 4.07107C9.70113 3.4389 10.2407 2.9162 10.8847 2.5534C11.5286 2.19061 12.2551 2 12.9943 2C13.7334 2 14.46 2.19061 15.104 2.5534C15.7479 2.9162 16.2875 3.4389 16.6705 4.07107L23.5785 16.0768C23.9199 16.6984 24.0899 17.3995 24.0709 18.1085C24.052 18.8174 23.8449 19.5086 23.4707 20.1111C23.0966 20.7135 22.5688 21.2056 21.9418 21.5369C21.3147 21.8682 20.6108 22.0268 19.9023 21.9963Z"
            stroke={props.color}
            strokeWidth="1.97285"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M11.751 17.4429C11.751 17.2786 11.7835 17.1159 11.8467 16.9643C11.9099 16.8126 12.0025 16.675 12.1193 16.5594C12.2359 16.4438 12.3744 16.3524 12.5265 16.2905C12.6788 16.2287 12.8416 16.1976 13.006 16.199C13.2483 16.2034 13.484 16.2791 13.6835 16.4167C13.883 16.5543 14.0376 16.7478 14.1279 16.9727C14.2181 17.1977 14.24 17.4442 14.1909 17.6816C14.1417 17.9189 14.0236 18.1365 13.8515 18.3072C13.6793 18.4778 13.4606 18.5938 13.2229 18.6409C12.9851 18.688 12.7388 18.6639 12.5146 18.5716C12.2904 18.4794 12.0985 18.3232 11.9627 18.1224C11.8268 17.9217 11.7532 17.6853 11.751 17.4429ZM12.1508 14.4109L11.9953 8.61357C11.9805 8.47421 11.9952 8.3333 12.0385 8.20001C12.0817 8.0667 12.1525 7.94397 12.2462 7.83979C12.3399 7.73561 12.4545 7.65231 12.5825 7.59528C12.7105 7.53826 12.8491 7.50879 12.9893 7.50879C13.1295 7.50879 13.2681 7.53826 13.396 7.59528C13.5241 7.65231 13.6386 7.73561 13.7323 7.83979C13.826 7.94397 13.8969 8.0667 13.9401 8.20001C13.9833 8.3333 13.9981 8.47421 13.9833 8.61357L13.8389 14.4109C13.8389 14.6347 13.75 14.8495 13.5917 15.0078C13.4333 15.166 13.2186 15.255 12.9949 15.255C12.771 15.255 12.5563 15.166 12.398 15.0078C12.2398 14.8495 12.1508 14.6347 12.1508 14.4109Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Qrcode:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 29 29"
          fill="none">
          <Path
            d="M17.5 13.5H17.5048H17.5106H17.5164H17.5222H17.528H17.5338H17.5397H17.5455H17.5513H17.5571H17.5629H17.5687H17.5745H17.5803H17.5861H17.5919H17.5977H17.6035H17.6093H17.6151H17.621H17.6268H17.6326H17.6384H17.6442H17.65H17.6558H17.6616H17.6674H17.6732H17.679H17.6849H17.6907H17.6965H17.7023H17.7081H17.7139H17.7197H17.7255H17.7313H17.7372H17.743H17.7488H17.7546H17.7604H17.7662H17.772H17.7778H17.7837H17.7895H17.7953H17.8011H17.8069H17.8127H17.8185H17.8244H17.8302H17.836H17.8418H17.8476H17.8534H17.8592H17.8651H17.8709H17.8767H17.8825H17.8883H17.8941H17.9H17.9058H17.9116H17.9174H17.9232H17.929H17.9349H17.9407H17.9465H17.9523H17.9581H17.964H17.9698H17.9756H17.9814H17.9872H17.9931H17.9989H18.0047H18.0105H18.0163H18.0222H18.028H18.0338H18.0396H18.0454H18.0513H18.0571H18.0629H18.0687H18.0746H18.0804H18.0862H18.092H18.0979H18.1037H18.1095H18.1153H18.1212H18.127H18.1328H18.1386H18.1445H18.1503H18.1561H18.1619H18.1678H18.1736H18.1794H18.1853H18.1911H18.1969H18.2027H18.2086H18.2144H18.2202H18.2261H18.2319H18.2377H18.2436H18.2494H18.2552H18.2611H18.2669H18.2727H18.2786H18.2844H18.2902H18.2961H18.3019H18.3077H18.3136H18.3194H18.3252H18.3311H18.3369H18.3427H18.3486H18.3544H18.3602H18.3661H18.3719H18.3778H18.3836H18.3894H18.3953H18.4011H18.407H18.4128H18.4186H18.4245H18.4303H18.4362H18.442H18.4478H18.4537H18.4595H18.4654H18.4712H18.4771H18.4829H18.4887H18.4946H18.5004H18.5063H18.5121H18.518H18.5238H18.5297H18.5355H18.5414H18.5472H18.5531H18.5589H18.5648H18.5706H18.5765H18.5823H18.5882H18.594H18.5999H18.6057H18.6116H18.6174H18.6233H18.6291H18.635H18.6408H18.6467H18.6525H18.6584H18.6643H18.6701H18.676H18.6818H18.6877H18.6935H18.6994H18.7053H18.7111H18.717H18.7228H18.7287H18.7345H18.7404H18.7463H18.7521H18.758H18.7639H18.7697H18.7756H18.7814H18.7873H18.7932H18.799H18.8049H18.8108H18.8166H18.8225H18.8284H18.8342H18.8401H18.846H18.8518H18.8577H18.8636H18.8694H18.8753H18.8812H18.8871H18.8929H18.8988H18.9047H18.9105H18.9164H18.9223H18.9282H18.934H18.9399H18.9458H18.9517H18.9575H18.9634H18.9693H18.9752H18.9811H18.9869H18.9928H18.9987H19.0046H19.0104H19.0163H19.0222H19.0281H19.034H19.0399H19.0457H19.0516H19.0575H19.0634H19.0693H19.0752H19.081H19.0869H19.0928H19.0987H19.1046H19.1105H19.1164H19.1223H19.1282H19.134H19.1399H19.1458H19.1517H19.1576H19.1635H19.1694H19.1753H19.1812H19.1871H19.193H19.1989H19.2048H19.2107H19.2166H19.2225H19.2284H19.2343H19.2402H19.2461H19.252H19.2579H19.2638H19.2697H19.2756H19.2815H19.2874H19.2933H19.2992H19.3051H19.311H19.3169H19.3228H19.3287H19.3346H19.3405H19.3464H19.3523H19.3583H19.3642H19.3701H19.376H19.3819H19.3878H19.3937H19.3996H19.4056H19.4115H19.4174H19.4233H19.4292H19.4351H19.4411H19.447H19.4529H19.4588H19.4647H19.4706H19.4766H19.4825H19.4884H19.4943H19.5V13.5048V13.5106V13.5164V13.5222V13.528V13.5338V13.5397V13.5455V13.5513V13.5571V13.5629V13.5687V13.5745V13.5803V13.5861V13.5919V13.5977V13.6035V13.6093V13.6151V13.621V13.6268V13.6326V13.6384V13.6442V13.65V13.6558V13.6616V13.6674V13.6732V13.679V13.6849V13.6907V13.6965V13.7023V13.7081V13.7139V13.7197V13.7255V13.7313V13.7372V13.743V13.7488V13.7546V13.7604V13.7662V13.772V13.7778V13.7837V13.7895V13.7953V13.8011V13.8069V13.8127V13.8185V13.8244V13.8302V13.836V13.8418V13.8476V13.8534V13.8592V13.8651V13.8709V13.8767V13.8825V13.8883V13.8941V13.9V13.9058V13.9116V13.9174V13.9232V13.929V13.9349V13.9407V13.9465V13.9523V13.9581V13.964V13.9698V13.9756V13.9814V13.9872V13.9931V13.9989V14.0047V14.0105V14.0163V14.0222V14.028V14.0338V14.0396V14.0454V14.0513V14.0571V14.0629V14.0687V14.0746V14.0804V14.0862V14.092V14.0979V14.1037V14.1095V14.1153V14.1212V14.127V14.1328V14.1386V14.1445V14.1503V14.1561V14.1619V14.1678V14.1736V14.1794V14.1853V14.1911V14.1969V14.2027V14.2086V14.2144V14.2202V14.2261V14.2319V14.2377V14.2436V14.2494V14.2552V14.2611V14.2669V14.2727V14.2786V14.2844V14.2902V14.2961V14.3019V14.3077V14.3136V14.3194V14.3252V14.3311V14.3369V14.3427V14.3486V14.3544V14.3602V14.3661V14.3719V14.3778V14.3836V14.3894V14.3953V14.4011V14.407V14.4128V14.4186V14.4245V14.4303V14.4362V14.442V14.4478V14.4537V14.4595V14.4654V14.4712V14.4771V14.4829V14.4887V14.4946V14.5004V14.5063V14.5121V14.518V14.5238V14.5297V14.5355V14.5414V14.5472V14.5531V14.5589V14.5648V14.5706V14.5765V14.5823V14.5882V14.594V14.5999V14.6057V14.6116V14.6174V14.6233V14.6291V14.635V14.6408V14.6467V14.6525V14.6584V14.6643V14.6701V14.676V14.6818V14.6877V14.6935V14.6994V14.7053V14.7111V14.717V14.7228V14.7287V14.7345V14.7404V14.7463V14.7521V14.758V14.7639V14.7697V14.7756V14.7814V14.7873V14.7932V14.799V14.8049V14.8108V14.8166V14.8225V14.8284V14.8342V14.8401V14.846V14.8518V14.8577V14.8636V14.8694V14.8753V14.8812V14.8871V14.8929V14.8988V14.9047V14.9105V14.9164V14.9223V14.9282V14.934V14.9399V14.9458V14.9517V14.9575V14.9634V14.9693V14.9752V14.9811V14.9869V14.9928V14.9987V15.0046V15.0104V15.0163V15.0222V15.0281V15.034V15.0399V15.0457V15.0516V15.0575V15.0634V15.0693V15.0752V15.081V15.0869V15.0928V15.0987V15.1046V15.1105V15.1164V15.1223V15.1282V15.134V15.1399V15.1458V15.1517V15.1576V15.1635V15.1694V15.1753V15.1812V15.1871V15.193V15.1989V15.2048V15.2107V15.2166V15.2225V15.2284V15.2343V15.2402V15.2461V15.252V15.2579V15.2638V15.2697V15.2756V15.2815V15.2874V15.2933V15.2992V15.3051V15.311V15.3169V15.3228V15.3287V15.3346V15.3405V15.3464V15.3523V15.3583V15.3642V15.3701V15.376V15.3819V15.3878V15.3937V15.3996V15.4056V15.4115V15.4174V15.4233V15.4292V15.4351V15.4411V15.447V15.4529V15.4588V15.4647V15.4706V15.4766V15.4825V15.4884V15.4943V15.5H19.4952H19.4894H19.4836H19.4778H19.472H19.4662H19.4603H19.4545H19.4487H19.4429H19.4371H19.4313H19.4255H19.4197H19.4139H19.4081H19.4023H19.3965H19.3907H19.3849H19.379H19.3732H19.3674H19.3616H19.3558H19.35H19.3442H19.3384H19.3326H19.3268H19.321H19.3151H19.3093H19.3035H19.2977H19.2919H19.2861H19.2803H19.2745H19.2687H19.2628H19.257H19.2512H19.2454H19.2396H19.2338H19.228H19.2222H19.2163H19.2105H19.2047H19.1989H19.1931H19.1873H19.1815H19.1756H19.1698H19.164H19.1582H19.1524H19.1466H19.1408H19.1349H19.1291H19.1233H19.1175H19.1117H19.1059H19.1H19.0942H19.0884H19.0826H19.0768H19.071H19.0651H19.0593H19.0535H19.0477H19.0419H19.036H19.0302H19.0244H19.0186H19.0128H19.0069H19.0011H18.9953H18.9895H18.9837H18.9778H18.972H18.9662H18.9604H18.9546H18.9487H18.9429H18.9371H18.9313H18.9254H18.9196H18.9138H18.908H18.9021H18.8963H18.8905H18.8847H18.8788H18.873H18.8672H18.8614H18.8555H18.8497H18.8439H18.8381H18.8322H18.8264H18.8206H18.8147H18.8089H18.8031H18.7973H18.7914H18.7856H18.7798H18.7739H18.7681H18.7623H18.7564H18.7506H18.7448H18.7389H18.7331H18.7273H18.7214H18.7156H18.7098H18.7039H18.6981H18.6923H18.6864H18.6806H18.6748H18.6689H18.6631H18.6573H18.6514H18.6456H18.6398H18.6339H18.6281H18.6222H18.6164H18.6106H18.6047H18.5989H18.593H18.5872H18.5814H18.5755H18.5697H18.5638H18.558H18.5522H18.5463H18.5405H18.5346H18.5288H18.5229H18.5171H18.5113H18.5054H18.4996H18.4937H18.4879H18.482H18.4762H18.4703H18.4645H18.4586H18.4528H18.4469H18.4411H18.4352H18.4294H18.4235H18.4177H18.4118H18.406H18.4001H18.3943H18.3884H18.3826H18.3767H18.3709H18.365H18.3592H18.3533H18.3475H18.3416H18.3357H18.3299H18.324H18.3182H18.3123H18.3065H18.3006H18.2947H18.2889H18.283H18.2772H18.2713H18.2655H18.2596H18.2537H18.2479H18.242H18.2361H18.2303H18.2244H18.2186H18.2127H18.2068H18.201H18.1951H18.1892H18.1834H18.1775H18.1716H18.1658H18.1599H18.154H18.1482H18.1423H18.1364H18.1306H18.1247H18.1188H18.1129H18.1071H18.1012H18.0953H18.0895H18.0836H18.0777H18.0718H18.066H18.0601H18.0542H18.0483H18.0425H18.0366H18.0307H18.0248H18.0189H18.0131H18.0072H18.0013H17.9954H17.9896H17.9837H17.9778H17.9719H17.966H17.9601H17.9543H17.9484H17.9425H17.9366H17.9307H17.9248H17.919H17.9131H17.9072H17.9013H17.8954H17.8895H17.8836H17.8777H17.8718H17.866H17.8601H17.8542H17.8483H17.8424H17.8365H17.8306H17.8247H17.8188H17.8129H17.807H17.8011H17.7952H17.7893H17.7834H17.7775H17.7716H17.7657H17.7598H17.7539H17.748H17.7421H17.7362H17.7303H17.7244H17.7185H17.7126H17.7067H17.7008H17.6949H17.689H17.6831H17.6772H17.6713H17.6654H17.6595H17.6536H17.6477H17.6417H17.6358H17.6299H17.624H17.6181H17.6122H17.6063H17.6004H17.5944H17.5885H17.5826H17.5767H17.5708H17.5649H17.5589H17.553H17.5471H17.5412H17.5353H17.5294H17.5234H17.5175H17.5116H17.5057H17.5V15.4952V15.4894V15.4836V15.4778V15.472V15.4662V15.4603V15.4545V15.4487V15.4429V15.4371V15.4313V15.4255V15.4197V15.4139V15.4081V15.4023V15.3965V15.3907V15.3849V15.379V15.3732V15.3674V15.3616V15.3558V15.35V15.3442V15.3384V15.3326V15.3268V15.321V15.3151V15.3093V15.3035V15.2977V15.2919V15.2861V15.2803V15.2745V15.2687V15.2628V15.257V15.2512V15.2454V15.2396V15.2338V15.228V15.2222V15.2163V15.2105V15.2047V15.1989V15.1931V15.1873V15.1815V15.1756V15.1698V15.164V15.1582V15.1524V15.1466V15.1408V15.1349V15.1291V15.1233V15.1175V15.1117V15.1059V15.1V15.0942V15.0884V15.0826V15.0768V15.071V15.0651V15.0593V15.0535V15.0477V15.0419V15.036V15.0302V15.0244V15.0186V15.0128V15.0069V15.0011V14.9953V14.9895V14.9837V14.9778V14.972V14.9662V14.9604V14.9546V14.9487V14.9429V14.9371V14.9313V14.9254V14.9196V14.9138V14.908V14.9021V14.8963V14.8905V14.8847V14.8788V14.873V14.8672V14.8614V14.8555V14.8497V14.8439V14.8381V14.8322V14.8264V14.8206V14.8147V14.8089V14.8031V14.7973V14.7914V14.7856V14.7798V14.7739V14.7681V14.7623V14.7564V14.7506V14.7448V14.7389V14.7331V14.7273V14.7214V14.7156V14.7098V14.7039V14.6981V14.6923V14.6864V14.6806V14.6748V14.6689V14.6631V14.6573V14.6514V14.6456V14.6398V14.6339V14.6281V14.6222V14.6164V14.6106V14.6047V14.5989V14.593V14.5872V14.5814V14.5755V14.5697V14.5638V14.558V14.5522V14.5463V14.5405V14.5346V14.5288V14.5229V14.5171V14.5113V14.5054V14.4996V14.4937V14.4879V14.482V14.4762V14.4703V14.4645V14.4586V14.4528V14.4469V14.4411V14.4352V14.4294V14.4235V14.4177V14.4118V14.406V14.4001V14.3943V14.3884V14.3826V14.3767V14.3709V14.365V14.3592V14.3533V14.3475V14.3416V14.3357V14.3299V14.324V14.3182V14.3123V14.3065V14.3006V14.2947V14.2889V14.283V14.2772V14.2713V14.2655V14.2596V14.2537V14.2479V14.242V14.2361V14.2303V14.2244V14.2186V14.2127V14.2068V14.201V14.1951V14.1892V14.1834V14.1775V14.1716V14.1658V14.1599V14.154V14.1482V14.1423V14.1364V14.1306V14.1247V14.1188V14.1129V14.1071V14.1012V14.0953V14.0895V14.0836V14.0777V14.0718V14.066V14.0601V14.0542V14.0483V14.0425V14.0366V14.0307V14.0248V14.0189V14.0131V14.0072V14.0013V13.9954V13.9896V13.9837V13.9778V13.9719V13.966V13.9601V13.9543V13.9484V13.9425V13.9366V13.9307V13.9248V13.919V13.9131V13.9072V13.9013V13.8954V13.8895V13.8836V13.8777V13.8718V13.866V13.8601V13.8542V13.8483V13.8424V13.8365V13.8306V13.8247V13.8188V13.8129V13.807V13.8011V13.7952V13.7893V13.7834V13.7775V13.7716V13.7657V13.7598V13.7539V13.748V13.7421V13.7362V13.7303V13.7244V13.7185V13.7126V13.7067V13.7008V13.6949V13.689V13.6831V13.6772V13.6713V13.6654V13.6595V13.6536V13.6477V13.6417V13.6358V13.6299V13.624V13.6181V13.6122V13.6063V13.6004V13.5944V13.5885V13.5826V13.5767V13.5708V13.5649V13.5589V13.553V13.5471V13.5412V13.5353V13.5294V13.5234V13.5175V13.5116V13.5057V13.5Z"
            fill={props.color}
            stroke={props.color}
          />
          <Path
            d="M22.5 13.5H22.5048H22.5106H22.5164H22.5222H22.528H22.5338H22.5397H22.5455H22.5513H22.5571H22.5629H22.5687H22.5745H22.5803H22.5861H22.5919H22.5977H22.6035H22.6093H22.6151H22.621H22.6268H22.6326H22.6384H22.6442H22.65H22.6558H22.6616H22.6674H22.6732H22.679H22.6849H22.6907H22.6965H22.7023H22.7081H22.7139H22.7197H22.7255H22.7313H22.7372H22.743H22.7488H22.7546H22.7604H22.7662H22.772H22.7778H22.7837H22.7895H22.7953H22.8011H22.8069H22.8127H22.8185H22.8244H22.8302H22.836H22.8418H22.8476H22.8534H22.8592H22.8651H22.8709H22.8767H22.8825H22.8883H22.8941H22.9H22.9058H22.9116H22.9174H22.9232H22.929H22.9349H22.9407H22.9465H22.9523H22.9581H22.964H22.9698H22.9756H22.9814H22.9872H22.9931H22.9989H23.0047H23.0105H23.0163H23.0222H23.028H23.0338H23.0396H23.0454H23.0513H23.0571H23.0629H23.0687H23.0746H23.0804H23.0862H23.092H23.0979H23.1037H23.1095H23.1153H23.1212H23.127H23.1328H23.1386H23.1445H23.1503H23.1561H23.1619H23.1678H23.1736H23.1794H23.1853H23.1911H23.1969H23.2027H23.2086H23.2144H23.2202H23.2261H23.2319H23.2377H23.2436H23.2494H23.2552H23.2611H23.2669H23.2727H23.2786H23.2844H23.2902H23.2961H23.3019H23.3077H23.3136H23.3194H23.3252H23.3311H23.3369H23.3427H23.3486H23.3544H23.3602H23.3661H23.3719H23.3778H23.3836H23.3894H23.3953H23.4011H23.407H23.4128H23.4186H23.4245H23.4303H23.4362H23.442H23.4478H23.4537H23.4595H23.4654H23.4712H23.4771H23.4829H23.4887H23.4946H23.5004H23.5063H23.5121H23.518H23.5238H23.5297H23.5355H23.5414H23.5472H23.5531H23.5589H23.5648H23.5706H23.5765H23.5823H23.5882H23.594H23.5999H23.6057H23.6116H23.6174H23.6233H23.6291H23.635H23.6408H23.6467H23.6525H23.6584H23.6643H23.6701H23.676H23.6818H23.6877H23.6935H23.6994H23.7053H23.7111H23.717H23.7228H23.7287H23.7345H23.7404H23.7463H23.7521H23.758H23.7639H23.7697H23.7756H23.7814H23.7873H23.7932H23.799H23.8049H23.8108H23.8166H23.8225H23.8284H23.8342H23.8401H23.846H23.8518H23.8577H23.8636H23.8694H23.8753H23.8812H23.8871H23.8929H23.8988H23.9047H23.9105H23.9164H23.9223H23.9282H23.934H23.9399H23.9458H23.9517H23.9575H23.9634H23.9693H23.9752H23.9811H23.9869H23.9928H23.9987H24.0046H24.0104H24.0163H24.0222H24.0281H24.034H24.0399H24.0457H24.0516H24.0575H24.0634H24.0693H24.0752H24.081H24.0869H24.0928H24.0987H24.1046H24.1105H24.1164H24.1223H24.1282H24.134H24.1399H24.1458H24.1517H24.1576H24.1635H24.1694H24.1753H24.1812H24.1871H24.193H24.1989H24.2048H24.2107H24.2166H24.2225H24.2284H24.2343H24.2402H24.2461H24.252H24.2579H24.2638H24.2697H24.2756H24.2815H24.2874H24.2933H24.2992H24.3051H24.311H24.3169H24.3228H24.3287H24.3346H24.3405H24.3464H24.3523H24.3583H24.3642H24.3701H24.376H24.3819H24.3878H24.3937H24.3996H24.4056H24.4115H24.4174H24.4233H24.4292H24.4351H24.4411H24.447H24.4529H24.4588H24.4647H24.4706H24.4766H24.4825H24.4884H24.4943H24.5V13.5048V13.5106V13.5164V13.5222V13.528V13.5338V13.5397V13.5455V13.5513V13.5571V13.5629V13.5687V13.5745V13.5803V13.5861V13.5919V13.5977V13.6035V13.6093V13.6151V13.621V13.6268V13.6326V13.6384V13.6442V13.65V13.6558V13.6616V13.6674V13.6732V13.679V13.6849V13.6907V13.6965V13.7023V13.7081V13.7139V13.7197V13.7255V13.7313V13.7372V13.743V13.7488V13.7546V13.7604V13.7662V13.772V13.7778V13.7837V13.7895V13.7953V13.8011V13.8069V13.8127V13.8185V13.8244V13.8302V13.836V13.8418V13.8476V13.8534V13.8592V13.8651V13.8709V13.8767V13.8825V13.8883V13.8941V13.9V13.9058V13.9116V13.9174V13.9232V13.929V13.9349V13.9407V13.9465V13.9523V13.9581V13.964V13.9698V13.9756V13.9814V13.9872V13.9931V13.9989V14.0047V14.0105V14.0163V14.0222V14.028V14.0338V14.0396V14.0454V14.0513V14.0571V14.0629V14.0687V14.0746V14.0804V14.0862V14.092V14.0979V14.1037V14.1095V14.1153V14.1212V14.127V14.1328V14.1386V14.1445V14.1503V14.1561V14.1619V14.1678V14.1736V14.1794V14.1853V14.1911V14.1969V14.2027V14.2086V14.2144V14.2202V14.2261V14.2319V14.2377V14.2436V14.2494V14.2552V14.2611V14.2669V14.2727V14.2786V14.2844V14.2902V14.2961V14.3019V14.3077V14.3136V14.3194V14.3252V14.3311V14.3369V14.3427V14.3486V14.3544V14.3602V14.3661V14.3719V14.3778V14.3836V14.3894V14.3953V14.4011V14.407V14.4128V14.4186V14.4245V14.4303V14.4362V14.442V14.4478V14.4537V14.4595V14.4654V14.4712V14.4771V14.4829V14.4887V14.4946V14.5004V14.5063V14.5121V14.518V14.5238V14.5297V14.5355V14.5414V14.5472V14.5531V14.5589V14.5648V14.5706V14.5765V14.5823V14.5882V14.594V14.5999V14.6057V14.6116V14.6174V14.6233V14.6291V14.635V14.6408V14.6467V14.6525V14.6584V14.6643V14.6701V14.676V14.6818V14.6877V14.6935V14.6994V14.7053V14.7111V14.717V14.7228V14.7287V14.7345V14.7404V14.7463V14.7521V14.758V14.7639V14.7697V14.7756V14.7814V14.7873V14.7932V14.799V14.8049V14.8108V14.8166V14.8225V14.8284V14.8342V14.8401V14.846V14.8518V14.8577V14.8636V14.8694V14.8753V14.8812V14.8871V14.8929V14.8988V14.9047V14.9105V14.9164V14.9223V14.9282V14.934V14.9399V14.9458V14.9517V14.9575V14.9634V14.9693V14.9752V14.9811V14.9869V14.9928V14.9987V15.0046V15.0104V15.0163V15.0222V15.0281V15.034V15.0399V15.0457V15.0516V15.0575V15.0634V15.0693V15.0752V15.081V15.0869V15.0928V15.0987V15.1046V15.1105V15.1164V15.1223V15.1282V15.134V15.1399V15.1458V15.1517V15.1576V15.1635V15.1694V15.1753V15.1812V15.1871V15.193V15.1989V15.2048V15.2107V15.2166V15.2225V15.2284V15.2343V15.2402V15.2461V15.252V15.2579V15.2638V15.2697V15.2756V15.2815V15.2874V15.2933V15.2992V15.3051V15.311V15.3169V15.3228V15.3287V15.3346V15.3405V15.3464V15.3523V15.3583V15.3642V15.3701V15.376V15.3819V15.3878V15.3937V15.3996V15.4056V15.4115V15.4174V15.4233V15.4292V15.4351V15.4411V15.447V15.4529V15.4588V15.4647V15.4706V15.4766V15.4825V15.4884V15.4943V15.5H24.4952H24.4894H24.4836H24.4778H24.472H24.4662H24.4603H24.4545H24.4487H24.4429H24.4371H24.4313H24.4255H24.4197H24.4139H24.4081H24.4023H24.3965H24.3907H24.3849H24.379H24.3732H24.3674H24.3616H24.3558H24.35H24.3442H24.3384H24.3326H24.3268H24.321H24.3151H24.3093H24.3035H24.2977H24.2919H24.2861H24.2803H24.2745H24.2687H24.2628H24.257H24.2512H24.2454H24.2396H24.2338H24.228H24.2222H24.2163H24.2105H24.2047H24.1989H24.1931H24.1873H24.1815H24.1756H24.1698H24.164H24.1582H24.1524H24.1466H24.1408H24.1349H24.1291H24.1233H24.1175H24.1117H24.1059H24.1H24.0942H24.0884H24.0826H24.0768H24.071H24.0651H24.0593H24.0535H24.0477H24.0419H24.036H24.0302H24.0244H24.0186H24.0128H24.0069H24.0011H23.9953H23.9895H23.9837H23.9778H23.972H23.9662H23.9604H23.9546H23.9487H23.9429H23.9371H23.9313H23.9254H23.9196H23.9138H23.908H23.9021H23.8963H23.8905H23.8847H23.8788H23.873H23.8672H23.8614H23.8555H23.8497H23.8439H23.8381H23.8322H23.8264H23.8206H23.8147H23.8089H23.8031H23.7973H23.7914H23.7856H23.7798H23.7739H23.7681H23.7623H23.7564H23.7506H23.7448H23.7389H23.7331H23.7273H23.7214H23.7156H23.7098H23.7039H23.6981H23.6923H23.6864H23.6806H23.6748H23.6689H23.6631H23.6573H23.6514H23.6456H23.6398H23.6339H23.6281H23.6222H23.6164H23.6106H23.6047H23.5989H23.593H23.5872H23.5814H23.5755H23.5697H23.5638H23.558H23.5522H23.5463H23.5405H23.5346H23.5288H23.5229H23.5171H23.5113H23.5054H23.4996H23.4937H23.4879H23.482H23.4762H23.4703H23.4645H23.4586H23.4528H23.4469H23.4411H23.4352H23.4294H23.4235H23.4177H23.4118H23.406H23.4001H23.3943H23.3884H23.3826H23.3767H23.3709H23.365H23.3592H23.3533H23.3475H23.3416H23.3357H23.3299H23.324H23.3182H23.3123H23.3065H23.3006H23.2947H23.2889H23.283H23.2772H23.2713H23.2655H23.2596H23.2537H23.2479H23.242H23.2361H23.2303H23.2244H23.2186H23.2127H23.2068H23.201H23.1951H23.1892H23.1834H23.1775H23.1716H23.1658H23.1599H23.154H23.1482H23.1423H23.1364H23.1306H23.1247H23.1188H23.1129H23.1071H23.1012H23.0953H23.0895H23.0836H23.0777H23.0718H23.066H23.0601H23.0542H23.0483H23.0425H23.0366H23.0307H23.0248H23.0189H23.0131H23.0072H23.0013H22.9954H22.9896H22.9837H22.9778H22.9719H22.966H22.9601H22.9543H22.9484H22.9425H22.9366H22.9307H22.9248H22.919H22.9131H22.9072H22.9013H22.8954H22.8895H22.8836H22.8777H22.8718H22.866H22.8601H22.8542H22.8483H22.8424H22.8365H22.8306H22.8247H22.8188H22.8129H22.807H22.8011H22.7952H22.7893H22.7834H22.7775H22.7716H22.7657H22.7598H22.7539H22.748H22.7421H22.7362H22.7303H22.7244H22.7185H22.7126H22.7067H22.7008H22.6949H22.689H22.6831H22.6772H22.6713H22.6654H22.6595H22.6536H22.6477H22.6417H22.6358H22.6299H22.624H22.6181H22.6122H22.6063H22.6004H22.5944H22.5885H22.5826H22.5767H22.5708H22.5649H22.5589H22.553H22.5471H22.5412H22.5353H22.5294H22.5234H22.5175H22.5116H22.5057H22.5V15.4952V15.4894V15.4836V15.4778V15.472V15.4662V15.4603V15.4545V15.4487V15.4429V15.4371V15.4313V15.4255V15.4197V15.4139V15.4081V15.4023V15.3965V15.3907V15.3849V15.379V15.3732V15.3674V15.3616V15.3558V15.35V15.3442V15.3384V15.3326V15.3268V15.321V15.3151V15.3093V15.3035V15.2977V15.2919V15.2861V15.2803V15.2745V15.2687V15.2628V15.257V15.2512V15.2454V15.2396V15.2338V15.228V15.2222V15.2163V15.2105V15.2047V15.1989V15.1931V15.1873V15.1815V15.1756V15.1698V15.164V15.1582V15.1524V15.1466V15.1408V15.1349V15.1291V15.1233V15.1175V15.1117V15.1059V15.1V15.0942V15.0884V15.0826V15.0768V15.071V15.0651V15.0593V15.0535V15.0477V15.0419V15.036V15.0302V15.0244V15.0186V15.0128V15.0069V15.0011V14.9953V14.9895V14.9837V14.9778V14.972V14.9662V14.9604V14.9546V14.9487V14.9429V14.9371V14.9313V14.9254V14.9196V14.9138V14.908V14.9021V14.8963V14.8905V14.8847V14.8788V14.873V14.8672V14.8614V14.8555V14.8497V14.8439V14.8381V14.8322V14.8264V14.8206V14.8147V14.8089V14.8031V14.7973V14.7914V14.7856V14.7798V14.7739V14.7681V14.7623V14.7564V14.7506V14.7448V14.7389V14.7331V14.7273V14.7214V14.7156V14.7098V14.7039V14.6981V14.6923V14.6864V14.6806V14.6748V14.6689V14.6631V14.6573V14.6514V14.6456V14.6398V14.6339V14.6281V14.6222V14.6164V14.6106V14.6047V14.5989V14.593V14.5872V14.5814V14.5755V14.5697V14.5638V14.558V14.5522V14.5463V14.5405V14.5346V14.5288V14.5229V14.5171V14.5113V14.5054V14.4996V14.4937V14.4879V14.482V14.4762V14.4703V14.4645V14.4586V14.4528V14.4469V14.4411V14.4352V14.4294V14.4235V14.4177V14.4118V14.406V14.4001V14.3943V14.3884V14.3826V14.3767V14.3709V14.365V14.3592V14.3533V14.3475V14.3416V14.3357V14.3299V14.324V14.3182V14.3123V14.3065V14.3006V14.2947V14.2889V14.283V14.2772V14.2713V14.2655V14.2596V14.2537V14.2479V14.242V14.2361V14.2303V14.2244V14.2186V14.2127V14.2068V14.201V14.1951V14.1892V14.1834V14.1775V14.1716V14.1658V14.1599V14.154V14.1482V14.1423V14.1364V14.1306V14.1247V14.1188V14.1129V14.1071V14.1012V14.0953V14.0895V14.0836V14.0777V14.0718V14.066V14.0601V14.0542V14.0483V14.0425V14.0366V14.0307V14.0248V14.0189V14.0131V14.0072V14.0013V13.9954V13.9896V13.9837V13.9778V13.9719V13.966V13.9601V13.9543V13.9484V13.9425V13.9366V13.9307V13.9248V13.919V13.9131V13.9072V13.9013V13.8954V13.8895V13.8836V13.8777V13.8718V13.866V13.8601V13.8542V13.8483V13.8424V13.8365V13.8306V13.8247V13.8188V13.8129V13.807V13.8011V13.7952V13.7893V13.7834V13.7775V13.7716V13.7657V13.7598V13.7539V13.748V13.7421V13.7362V13.7303V13.7244V13.7185V13.7126V13.7067V13.7008V13.6949V13.689V13.6831V13.6772V13.6713V13.6654V13.6595V13.6536V13.6477V13.6417V13.6358V13.6299V13.624V13.6181V13.6122V13.6063V13.6004V13.5944V13.5885V13.5826V13.5767V13.5708V13.5649V13.5589V13.553V13.5471V13.5412V13.5353V13.5294V13.5234V13.5175V13.5116V13.5057V13.5Z"
            fill={props.color}
            stroke={props.color}
          />
          <Path
            d="M20.5 16.5H20.5031H20.5069H20.5108H20.5147H20.5186H20.5224H20.5263H20.5302H20.5341H20.5379H20.5418H20.5457H20.5496H20.5534H20.5573H20.5612H20.5651H20.5689H20.5728H20.5767H20.5806H20.5845H20.5883H20.5922H20.5961H20.6H20.6038H20.6077H20.6116H20.6155H20.6194H20.6232H20.6271H20.631H20.6349H20.6388H20.6426H20.6465H20.6504H20.6543H20.6582H20.662H20.6659H20.6698H20.6737H20.6776H20.6814H20.6853H20.6892H20.6931H20.697H20.7008H20.7047H20.7086H20.7125H20.7164H20.7203H20.7241H20.728H20.7319H20.7358H20.7397H20.7436H20.7474H20.7513H20.7552H20.7591H20.763H20.7669H20.7707H20.7746H20.7785H20.7824H20.7863H20.7902H20.7941H20.7979H20.8018H20.8057H20.8096H20.8135H20.8174H20.8213H20.8252H20.829H20.8329H20.8368H20.8407H20.8446H20.8485H20.8524H20.8563H20.8601H20.864H20.8679H20.8718H20.8757H20.8796H20.8835H20.8874H20.8913H20.8952H20.899H20.9029H20.9068H20.9107H20.9146H20.9185H20.9224H20.9263H20.9302H20.9341H20.938H20.9419H20.9458H20.9497H20.9535H20.9574H20.9613H20.9652H20.9691H20.973H20.9769H20.9808H20.9847H20.9886H20.9925H20.9964H21.0003H21.0042H21.0081H21.012H21.0159H21.0198H21.0237H21.0276H21.0315H21.0354H21.0393H21.0432H21.0471H21.051H21.0549H21.0588H21.0627H21.0666H21.0705H21.0744H21.0783H21.0822H21.0861H21.09H21.0939H21.0978H21.1017H21.1056H21.1095H21.1134H21.1173H21.1212H21.1251H21.129H21.1329H21.1368H21.1407H21.1446H21.1486H21.1525H21.1564H21.1603H21.1642H21.1681H21.172H21.1759H21.1798H21.1837H21.1876H21.1915H21.1954H21.1994H21.2033H21.2072H21.2111H21.215H21.2189H21.2228H21.2267H21.2306H21.2346H21.2385H21.2424H21.2463H21.2502H21.2541H21.258H21.262H21.2659H21.2698H21.2737H21.2776H21.2815H21.2854H21.2894H21.2933H21.2972H21.3011H21.305H21.3089H21.3129H21.3168H21.3207H21.3246H21.3285H21.3325H21.3364H21.3403H21.3442H21.3481H21.3521H21.356H21.3599H21.3638H21.3677H21.3717H21.3756H21.3795H21.3834H21.3874H21.3913H21.3952H21.3991H21.4031H21.407H21.4109H21.4148H21.4188H21.4227H21.4266H21.4306H21.4345H21.4384H21.4423H21.4463H21.4502H21.4541H21.4581H21.462H21.4659H21.4698H21.4738H21.4777H21.4816H21.4856H21.4895H21.4934H21.4974H21.5V16.5031V16.5069V16.5108V16.5147V16.5186V16.5224V16.5263V16.5302V16.5341V16.5379V16.5418V16.5457V16.5496V16.5534V16.5573V16.5612V16.5651V16.5689V16.5728V16.5767V16.5806V16.5845V16.5883V16.5922V16.5961V16.6V16.6038V16.6077V16.6116V16.6155V16.6194V16.6232V16.6271V16.631V16.6349V16.6388V16.6426V16.6465V16.6504V16.6543V16.6582V16.662V16.6659V16.6698V16.6737V16.6776V16.6814V16.6853V16.6892V16.6931V16.697V16.7008V16.7047V16.7086V16.7125V16.7164V16.7203V16.7241V16.728V16.7319V16.7358V16.7397V16.7436V16.7474V16.7513V16.7552V16.7591V16.763V16.7669V16.7707V16.7746V16.7785V16.7824V16.7863V16.7902V16.7941V16.7979V16.8018V16.8057V16.8096V16.8135V16.8174V16.8213V16.8252V16.829V16.8329V16.8368V16.8407V16.8446V16.8485V16.8524V16.8563V16.8601V16.864V16.8679V16.8718V16.8757V16.8796V16.8835V16.8874V16.8913V16.8952V16.899V16.9029V16.9068V16.9107V16.9146V16.9185V16.9224V16.9263V16.9302V16.9341V16.938V16.9419V16.9458V16.9497V16.9535V16.9574V16.9613V16.9652V16.9691V16.973V16.9769V16.9808V16.9847V16.9886V16.9925V16.9964V17.0003V17.0042V17.0081V17.012V17.0159V17.0198V17.0237V17.0276V17.0315V17.0354V17.0393V17.0432V17.0471V17.051V17.0549V17.0588V17.0627V17.0666V17.0705V17.0744V17.0783V17.0822V17.0861V17.09V17.0939V17.0978V17.1017V17.1056V17.1095V17.1134V17.1173V17.1212V17.1251V17.129V17.1329V17.1368V17.1407V17.1446V17.1486V17.1525V17.1564V17.1603V17.1642V17.1681V17.172V17.1759V17.1798V17.1837V17.1876V17.1915V17.1954V17.1994V17.2033V17.2072V17.2111V17.215V17.2189V17.2228V17.2267V17.2306V17.2346V17.2385V17.2424V17.2463V17.2502V17.2541V17.258V17.262V17.2659V17.2698V17.2737V17.2776V17.2815V17.2854V17.2894V17.2933V17.2972V17.3011V17.305V17.3089V17.3129V17.3168V17.3207V17.3246V17.3285V17.3325V17.3364V17.3403V17.3442V17.3481V17.3521V17.356V17.3599V17.3638V17.3677V17.3717V17.3756V17.3795V17.3834V17.3874V17.3913V17.3952V17.3991V17.4031V17.407V17.4109V17.4148V17.4188V17.4227V17.4266V17.4306V17.4345V17.4384V17.4423V17.4463V17.4502V17.4541V17.4581V17.462V17.4659V17.4698V17.4738V17.4777V17.4816V17.4856V17.4895V17.4934V17.4974V17.5H21.4969H21.4931H21.4892H21.4853H21.4814H21.4776H21.4737H21.4698H21.4659H21.4621H21.4582H21.4543H21.4504H21.4466H21.4427H21.4388H21.4349H21.4311H21.4272H21.4233H21.4194H21.4155H21.4117H21.4078H21.4039H21.4H21.3962H21.3923H21.3884H21.3845H21.3806H21.3768H21.3729H21.369H21.3651H21.3612H21.3574H21.3535H21.3496H21.3457H21.3418H21.338H21.3341H21.3302H21.3263H21.3224H21.3186H21.3147H21.3108H21.3069H21.303H21.2992H21.2953H21.2914H21.2875H21.2836H21.2797H21.2759H21.272H21.2681H21.2642H21.2603H21.2564H21.2526H21.2487H21.2448H21.2409H21.237H21.2331H21.2293H21.2254H21.2215H21.2176H21.2137H21.2098H21.2059H21.2021H21.1982H21.1943H21.1904H21.1865H21.1826H21.1787H21.1748H21.171H21.1671H21.1632H21.1593H21.1554H21.1515H21.1476H21.1437H21.1399H21.136H21.1321H21.1282H21.1243H21.1204H21.1165H21.1126H21.1087H21.1048H21.101H21.0971H21.0932H21.0893H21.0854H21.0815H21.0776H21.0737H21.0698H21.0659H21.062H21.0581H21.0542H21.0503H21.0465H21.0426H21.0387H21.0348H21.0309H21.027H21.0231H21.0192H21.0153H21.0114H21.0075H21.0036H20.9997H20.9958H20.9919H20.988H20.9841H20.9802H20.9763H20.9724H20.9685H20.9646H20.9607H20.9568H20.9529H20.949H20.9451H20.9412H20.9373H20.9334H20.9295H20.9256H20.9217H20.9178H20.9139H20.91H20.9061H20.9022H20.8983H20.8944H20.8905H20.8866H20.8827H20.8788H20.8749H20.871H20.8671H20.8632H20.8593H20.8554H20.8514H20.8475H20.8436H20.8397H20.8358H20.8319H20.828H20.8241H20.8202H20.8163H20.8124H20.8085H20.8046H20.8006H20.7967H20.7928H20.7889H20.785H20.7811H20.7772H20.7733H20.7694H20.7654H20.7615H20.7576H20.7537H20.7498H20.7459H20.742H20.738H20.7341H20.7302H20.7263H20.7224H20.7185H20.7146H20.7106H20.7067H20.7028H20.6989H20.695H20.6911H20.6871H20.6832H20.6793H20.6754H20.6715H20.6675H20.6636H20.6597H20.6558H20.6519H20.6479H20.644H20.6401H20.6362H20.6323H20.6283H20.6244H20.6205H20.6166H20.6126H20.6087H20.6048H20.6009H20.5969H20.593H20.5891H20.5852H20.5812H20.5773H20.5734H20.5694H20.5655H20.5616H20.5577H20.5537H20.5498H20.5459H20.5419H20.538H20.5341H20.5302H20.5262H20.5223H20.5184H20.5144H20.5105H20.5066H20.5026H20.5V17.4969V17.4931V17.4892V17.4853V17.4814V17.4776V17.4737V17.4698V17.4659V17.4621V17.4582V17.4543V17.4504V17.4466V17.4427V17.4388V17.4349V17.4311V17.4272V17.4233V17.4194V17.4155V17.4117V17.4078V17.4039V17.4V17.3962V17.3923V17.3884V17.3845V17.3806V17.3768V17.3729V17.369V17.3651V17.3612V17.3574V17.3535V17.3496V17.3457V17.3418V17.338V17.3341V17.3302V17.3263V17.3224V17.3186V17.3147V17.3108V17.3069V17.303V17.2992V17.2953V17.2914V17.2875V17.2836V17.2797V17.2759V17.272V17.2681V17.2642V17.2603V17.2564V17.2526V17.2487V17.2448V17.2409V17.237V17.2331V17.2293V17.2254V17.2215V17.2176V17.2137V17.2098V17.2059V17.2021V17.1982V17.1943V17.1904V17.1865V17.1826V17.1787V17.1748V17.171V17.1671V17.1632V17.1593V17.1554V17.1515V17.1476V17.1437V17.1399V17.136V17.1321V17.1282V17.1243V17.1204V17.1165V17.1126V17.1087V17.1048V17.101V17.0971V17.0932V17.0893V17.0854V17.0815V17.0776V17.0737V17.0698V17.0659V17.062V17.0581V17.0542V17.0503V17.0465V17.0426V17.0387V17.0348V17.0309V17.027V17.0231V17.0192V17.0153V17.0114V17.0075V17.0036V16.9997V16.9958V16.9919V16.988V16.9841V16.9802V16.9763V16.9724V16.9685V16.9646V16.9607V16.9568V16.9529V16.949V16.9451V16.9412V16.9373V16.9334V16.9295V16.9256V16.9217V16.9178V16.9139V16.91V16.9061V16.9022V16.8983V16.8944V16.8905V16.8866V16.8827V16.8788V16.8749V16.871V16.8671V16.8632V16.8593V16.8554V16.8514V16.8475V16.8436V16.8397V16.8358V16.8319V16.828V16.8241V16.8202V16.8163V16.8124V16.8085V16.8046V16.8006V16.7967V16.7928V16.7889V16.785V16.7811V16.7772V16.7733V16.7694V16.7654V16.7615V16.7576V16.7537V16.7498V16.7459V16.742V16.738V16.7341V16.7302V16.7263V16.7224V16.7185V16.7146V16.7106V16.7067V16.7028V16.6989V16.695V16.6911V16.6871V16.6832V16.6793V16.6754V16.6715V16.6675V16.6636V16.6597V16.6558V16.6519V16.6479V16.644V16.6401V16.6362V16.6323V16.6283V16.6244V16.6205V16.6166V16.6126V16.6087V16.6048V16.6009V16.5969V16.593V16.5891V16.5852V16.5812V16.5773V16.5734V16.5694V16.5655V16.5616V16.5577V16.5537V16.5498V16.5459V16.5419V16.538V16.5341V16.5302V16.5262V16.5223V16.5184V16.5144V16.5105V16.5066V16.5026V16.5Z"
            fill={props.color}
            stroke={props.color}
          />
          <Path
            d="M20.5 22.5H20.5048H20.5106H20.5164H20.5222H20.528H20.5338H20.5397H20.5455H20.5513H20.5571H20.5629H20.5687H20.5745H20.5803H20.5861H20.5919H20.5977H20.6035H20.6093H20.6151H20.621H20.6268H20.6326H20.6384H20.6442H20.65H20.6558H20.6616H20.6674H20.6732H20.679H20.6849H20.6907H20.6965H20.7023H20.7081H20.7139H20.7197H20.7255H20.7313H20.7372H20.743H20.7488H20.7546H20.7604H20.7662H20.772H20.7778H20.7837H20.7895H20.7953H20.8011H20.8069H20.8127H20.8185H20.8244H20.8302H20.836H20.8418H20.8476H20.8534H20.8592H20.8651H20.8709H20.8767H20.8825H20.8883H20.8941H20.9H20.9058H20.9116H20.9174H20.9232H20.929H20.9349H20.9407H20.9465H20.9523H20.9581H20.964H20.9698H20.9756H20.9814H20.9872H20.9931H20.9989H21.0047H21.0105H21.0163H21.0222H21.028H21.0338H21.0396H21.0454H21.0513H21.0571H21.0629H21.0687H21.0746H21.0804H21.0862H21.092H21.0979H21.1037H21.1095H21.1153H21.1212H21.127H21.1328H21.1386H21.1445H21.1503H21.1561H21.1619H21.1678H21.1736H21.1794H21.1853H21.1911H21.1969H21.2027H21.2086H21.2144H21.2202H21.2261H21.2319H21.2377H21.2436H21.2494H21.2552H21.2611H21.2669H21.2727H21.2786H21.2844H21.2902H21.2961H21.3019H21.3077H21.3136H21.3194H21.3252H21.3311H21.3369H21.3427H21.3486H21.3544H21.3602H21.3661H21.3719H21.3778H21.3836H21.3894H21.3953H21.4011H21.407H21.4128H21.4186H21.4245H21.4303H21.4362H21.442H21.4478H21.4537H21.4595H21.4654H21.4712H21.4771H21.4829H21.4887H21.4946H21.5004H21.5063H21.5121H21.518H21.5238H21.5297H21.5355H21.5414H21.5472H21.5531H21.5589H21.5648H21.5706H21.5765H21.5823H21.5882H21.594H21.5999H21.6057H21.6116H21.6174H21.6233H21.6291H21.635H21.6408H21.6467H21.6525H21.6584H21.6643H21.6701H21.676H21.6818H21.6877H21.6935H21.6994H21.7053H21.7111H21.717H21.7228H21.7287H21.7345H21.7404H21.7463H21.7521H21.758H21.7639H21.7697H21.7756H21.7814H21.7873H21.7932H21.799H21.8049H21.8108H21.8166H21.8225H21.8284H21.8342H21.8401H21.846H21.8518H21.8577H21.8636H21.8694H21.8753H21.8812H21.8871H21.8929H21.8988H21.9047H21.9105H21.9164H21.9223H21.9282H21.934H21.9399H21.9458H21.9517H21.9575H21.9634H21.9693H21.9752H21.9811H21.9869H21.9928H21.9987H22.0046H22.0104H22.0163H22.0222H22.0281H22.034H22.0399H22.0457H22.0516H22.0575H22.0634H22.0693H22.0752H22.081H22.0869H22.0928H22.0987H22.1046H22.1105H22.1164H22.1223H22.1282H22.134H22.1399H22.1458H22.1517H22.1576H22.1635H22.1694H22.1753H22.1812H22.1871H22.193H22.1989H22.2048H22.2107H22.2166H22.2225H22.2284H22.2343H22.2402H22.2461H22.252H22.2579H22.2638H22.2697H22.2756H22.2815H22.2874H22.2933H22.2992H22.3051H22.311H22.3169H22.3228H22.3287H22.3346H22.3405H22.3464H22.3523H22.3583H22.3642H22.3701H22.376H22.3819H22.3878H22.3937H22.3996H22.4056H22.4115H22.4174H22.4233H22.4292H22.4351H22.4411H22.447H22.4529H22.4588H22.4647H22.4706H22.4766H22.4825H22.4884H22.4943H22.5V22.5048V22.5106V22.5164V22.5222V22.528V22.5338V22.5397V22.5455V22.5513V22.5571V22.5629V22.5687V22.5745V22.5803V22.5861V22.5919V22.5977V22.6035V22.6093V22.6151V22.621V22.6268V22.6326V22.6384V22.6442V22.65V22.6558V22.6616V22.6674V22.6732V22.679V22.6849V22.6907V22.6965V22.7023V22.7081V22.7139V22.7197V22.7255V22.7313V22.7372V22.743V22.7488V22.7546V22.7604V22.7662V22.772V22.7778V22.7837V22.7895V22.7953V22.8011V22.8069V22.8127V22.8185V22.8244V22.8302V22.836V22.8418V22.8476V22.8534V22.8592V22.8651V22.8709V22.8767V22.8825V22.8883V22.8941V22.9V22.9058V22.9116V22.9174V22.9232V22.929V22.9349V22.9407V22.9465V22.9523V22.9581V22.964V22.9698V22.9756V22.9814V22.9872V22.9931V22.9989V23.0047V23.0105V23.0163V23.0222V23.028V23.0338V23.0396V23.0454V23.0513V23.0571V23.0629V23.0687V23.0746V23.0804V23.0862V23.092V23.0979V23.1037V23.1095V23.1153V23.1212V23.127V23.1328V23.1386V23.1445V23.1503V23.1561V23.1619V23.1678V23.1736V23.1794V23.1853V23.1911V23.1969V23.2027V23.2086V23.2144V23.2202V23.2261V23.2319V23.2377V23.2436V23.2494V23.2552V23.2611V23.2669V23.2727V23.2786V23.2844V23.2902V23.2961V23.3019V23.3077V23.3136V23.3194V23.3252V23.3311V23.3369V23.3427V23.3486V23.3544V23.3602V23.3661V23.3719V23.3778V23.3836V23.3894V23.3953V23.4011V23.407V23.4128V23.4186V23.4245V23.4303V23.4362V23.442V23.4478V23.4537V23.4595V23.4654V23.4712V23.4771V23.4829V23.4887V23.4946V23.5004V23.5063V23.5121V23.518V23.5238V23.5297V23.5355V23.5414V23.5472V23.5531V23.5589V23.5648V23.5706V23.5765V23.5823V23.5882V23.594V23.5999V23.6057V23.6116V23.6174V23.6233V23.6291V23.635V23.6408V23.6467V23.6525V23.6584V23.6643V23.6701V23.676V23.6818V23.6877V23.6935V23.6994V23.7053V23.7111V23.717V23.7228V23.7287V23.7345V23.7404V23.7463V23.7521V23.758V23.7639V23.7697V23.7756V23.7814V23.7873V23.7932V23.799V23.8049V23.8108V23.8166V23.8225V23.8284V23.8342V23.8401V23.846V23.8518V23.8577V23.8636V23.8694V23.8753V23.8812V23.8871V23.8929V23.8988V23.9047V23.9105V23.9164V23.9223V23.9282V23.934V23.9399V23.9458V23.9517V23.9575V23.9634V23.9693V23.9752V23.9811V23.9869V23.9928V23.9987V24.0046V24.0104V24.0163V24.0222V24.0281V24.034V24.0399V24.0457V24.0516V24.0575V24.0634V24.0693V24.0752V24.081V24.0869V24.0928V24.0987V24.1046V24.1105V24.1164V24.1223V24.1282V24.134V24.1399V24.1458V24.1517V24.1576V24.1635V24.1694V24.1753V24.1812V24.1871V24.193V24.1989V24.2048V24.2107V24.2166V24.2225V24.2284V24.2343V24.2402V24.2461V24.252V24.2579V24.2638V24.2697V24.2756V24.2815V24.2874V24.2933V24.2992V24.3051V24.311V24.3169V24.3228V24.3287V24.3346V24.3405V24.3464V24.3523V24.3583V24.3642V24.3701V24.376V24.3819V24.3878V24.3937V24.3996V24.4056V24.4115V24.4174V24.4233V24.4292V24.4351V24.4411V24.447V24.4529V24.4588V24.4647V24.4706V24.4766V24.4825V24.4884V24.4943V24.5H22.4952H22.4894H22.4836H22.4778H22.472H22.4662H22.4603H22.4545H22.4487H22.4429H22.4371H22.4313H22.4255H22.4197H22.4139H22.4081H22.4023H22.3965H22.3907H22.3849H22.379H22.3732H22.3674H22.3616H22.3558H22.35H22.3442H22.3384H22.3326H22.3268H22.321H22.3151H22.3093H22.3035H22.2977H22.2919H22.2861H22.2803H22.2745H22.2687H22.2628H22.257H22.2512H22.2454H22.2396H22.2338H22.228H22.2222H22.2163H22.2105H22.2047H22.1989H22.1931H22.1873H22.1815H22.1756H22.1698H22.164H22.1582H22.1524H22.1466H22.1408H22.1349H22.1291H22.1233H22.1175H22.1117H22.1059H22.1H22.0942H22.0884H22.0826H22.0768H22.071H22.0651H22.0593H22.0535H22.0477H22.0419H22.036H22.0302H22.0244H22.0186H22.0128H22.0069H22.0011H21.9953H21.9895H21.9837H21.9778H21.972H21.9662H21.9604H21.9546H21.9487H21.9429H21.9371H21.9313H21.9254H21.9196H21.9138H21.908H21.9021H21.8963H21.8905H21.8847H21.8788H21.873H21.8672H21.8614H21.8555H21.8497H21.8439H21.8381H21.8322H21.8264H21.8206H21.8147H21.8089H21.8031H21.7973H21.7914H21.7856H21.7798H21.7739H21.7681H21.7623H21.7564H21.7506H21.7448H21.7389H21.7331H21.7273H21.7214H21.7156H21.7098H21.7039H21.6981H21.6923H21.6864H21.6806H21.6748H21.6689H21.6631H21.6573H21.6514H21.6456H21.6398H21.6339H21.6281H21.6222H21.6164H21.6106H21.6047H21.5989H21.593H21.5872H21.5814H21.5755H21.5697H21.5638H21.558H21.5522H21.5463H21.5405H21.5346H21.5288H21.5229H21.5171H21.5113H21.5054H21.4996H21.4937H21.4879H21.482H21.4762H21.4703H21.4645H21.4586H21.4528H21.4469H21.4411H21.4352H21.4294H21.4235H21.4177H21.4118H21.406H21.4001H21.3943H21.3884H21.3826H21.3767H21.3709H21.365H21.3592H21.3533H21.3475H21.3416H21.3357H21.3299H21.324H21.3182H21.3123H21.3065H21.3006H21.2947H21.2889H21.283H21.2772H21.2713H21.2655H21.2596H21.2537H21.2479H21.242H21.2361H21.2303H21.2244H21.2186H21.2127H21.2068H21.201H21.1951H21.1892H21.1834H21.1775H21.1716H21.1658H21.1599H21.154H21.1482H21.1423H21.1364H21.1306H21.1247H21.1188H21.1129H21.1071H21.1012H21.0953H21.0895H21.0836H21.0777H21.0718H21.066H21.0601H21.0542H21.0483H21.0425H21.0366H21.0307H21.0248H21.0189H21.0131H21.0072H21.0013H20.9954H20.9896H20.9837H20.9778H20.9719H20.966H20.9601H20.9543H20.9484H20.9425H20.9366H20.9307H20.9248H20.919H20.9131H20.9072H20.9013H20.8954H20.8895H20.8836H20.8777H20.8718H20.866H20.8601H20.8542H20.8483H20.8424H20.8365H20.8306H20.8247H20.8188H20.8129H20.807H20.8011H20.7952H20.7893H20.7834H20.7775H20.7716H20.7657H20.7598H20.7539H20.748H20.7421H20.7362H20.7303H20.7244H20.7185H20.7126H20.7067H20.7008H20.6949H20.689H20.6831H20.6772H20.6713H20.6654H20.6595H20.6536H20.6477H20.6417H20.6358H20.6299H20.624H20.6181H20.6122H20.6063H20.6004H20.5944H20.5885H20.5826H20.5767H20.5708H20.5649H20.5589H20.553H20.5471H20.5412H20.5353H20.5294H20.5234H20.5175H20.5116H20.5057H20.5V24.4952V24.4894V24.4836V24.4778V24.472V24.4662V24.4603V24.4545V24.4487V24.4429V24.4371V24.4313V24.4255V24.4197V24.4139V24.4081V24.4023V24.3965V24.3907V24.3849V24.379V24.3732V24.3674V24.3616V24.3558V24.35V24.3442V24.3384V24.3326V24.3268V24.321V24.3151V24.3093V24.3035V24.2977V24.2919V24.2861V24.2803V24.2745V24.2687V24.2628V24.257V24.2512V24.2454V24.2396V24.2338V24.228V24.2222V24.2163V24.2105V24.2047V24.1989V24.1931V24.1873V24.1815V24.1756V24.1698V24.164V24.1582V24.1524V24.1466V24.1408V24.1349V24.1291V24.1233V24.1175V24.1117V24.1059V24.1V24.0942V24.0884V24.0826V24.0768V24.071V24.0651V24.0593V24.0535V24.0477V24.0419V24.036V24.0302V24.0244V24.0186V24.0128V24.0069V24.0011V23.9953V23.9895V23.9837V23.9778V23.972V23.9662V23.9604V23.9546V23.9487V23.9429V23.9371V23.9313V23.9254V23.9196V23.9138V23.908V23.9021V23.8963V23.8905V23.8847V23.8788V23.873V23.8672V23.8614V23.8555V23.8497V23.8439V23.8381V23.8322V23.8264V23.8206V23.8147V23.8089V23.8031V23.7973V23.7914V23.7856V23.7798V23.7739V23.7681V23.7623V23.7564V23.7506V23.7448V23.7389V23.7331V23.7273V23.7214V23.7156V23.7098V23.7039V23.6981V23.6923V23.6864V23.6806V23.6748V23.6689V23.6631V23.6573V23.6514V23.6456V23.6398V23.6339V23.6281V23.6222V23.6164V23.6106V23.6047V23.5989V23.593V23.5872V23.5814V23.5755V23.5697V23.5638V23.558V23.5522V23.5463V23.5405V23.5346V23.5288V23.5229V23.5171V23.5113V23.5054V23.4996V23.4937V23.4879V23.482V23.4762V23.4703V23.4645V23.4586V23.4528V23.4469V23.4411V23.4352V23.4294V23.4235V23.4177V23.4118V23.406V23.4001V23.3943V23.3884V23.3826V23.3767V23.3709V23.365V23.3592V23.3533V23.3475V23.3416V23.3357V23.3299V23.324V23.3182V23.3123V23.3065V23.3006V23.2947V23.2889V23.283V23.2772V23.2713V23.2655V23.2596V23.2537V23.2479V23.242V23.2361V23.2303V23.2244V23.2186V23.2127V23.2068V23.201V23.1951V23.1892V23.1834V23.1775V23.1716V23.1658V23.1599V23.154V23.1482V23.1423V23.1364V23.1306V23.1247V23.1188V23.1129V23.1071V23.1012V23.0953V23.0895V23.0836V23.0777V23.0718V23.066V23.0601V23.0542V23.0483V23.0425V23.0366V23.0307V23.0248V23.0189V23.0131V23.0072V23.0013V22.9954V22.9896V22.9837V22.9778V22.9719V22.966V22.9601V22.9543V22.9484V22.9425V22.9366V22.9307V22.9248V22.919V22.9131V22.9072V22.9013V22.8954V22.8895V22.8836V22.8777V22.8718V22.866V22.8601V22.8542V22.8483V22.8424V22.8365V22.8306V22.8247V22.8188V22.8129V22.807V22.8011V22.7952V22.7893V22.7834V22.7775V22.7716V22.7657V22.7598V22.7539V22.748V22.7421V22.7362V22.7303V22.7244V22.7185V22.7126V22.7067V22.7008V22.6949V22.689V22.6831V22.6772V22.6713V22.6654V22.6595V22.6536V22.6477V22.6417V22.6358V22.6299V22.624V22.6181V22.6122V22.6063V22.6004V22.5944V22.5885V22.5826V22.5767V22.5708V22.5649V22.5589V22.553V22.5471V22.5412V22.5353V22.5294V22.5234V22.5175V22.5116V22.5057V22.5Z"
            fill={props.color}
            stroke={props.color}
          />
          <Path
            d="M14.564 11.9536V11.9432V11.9308V11.9183V11.9059V11.8934V11.8809V11.8685V11.856V11.8436V11.8311V11.8187V11.8062V11.7938V11.7813V11.7689V11.7564V11.744V11.7315V11.7191V11.7066V11.6942V11.6817V11.6693V11.6568V11.6443V11.6319V11.6194V11.607V11.5945V11.5821V11.5696V11.5572V11.5447V11.5323V11.5198V11.5073V11.4949V11.4824V11.47V11.4575V11.4451V11.4326V11.4201V11.4077V11.3952V11.3828V11.3703V11.3578V11.3454V11.3329V11.3205V11.308V11.2955V11.2831V11.2706V11.2582V11.2457V11.2332V11.2208V11.2083V11.1959V11.1834V11.1709V11.1585V11.146V11.1335V11.1211V11.1086V11.0961V11.0837V11.0712V11.0587V11.0463V11.0338V11.0213V11.0089V10.9964V10.9839V10.9715V10.959V10.9465V10.9341V10.9216V10.9091V10.8967V10.8842V10.8717V10.8592V10.8468V10.8343V10.8218V10.8093V10.7969V10.7844V10.7719V10.7595V10.747V10.7345V10.722V10.7095V10.6971V10.6846V10.6721V10.6596V10.6472V10.6347V10.6222V10.6097V10.5972V10.5848V10.5723V10.5598V10.5473V10.5348V10.5224V10.5099V10.4974V10.4849V10.4724V10.4599V10.4475V10.435V10.4225V10.41V10.3975V10.385V10.3725V10.36V10.3476V10.3351V10.3226V10.3101V10.2976V10.2851V10.2726V10.2601V10.2476V10.2351V10.2226V10.2101V10.1976V10.1851V10.1727V10.1602V10.1477V10.1352V10.1227V10.1102V10.0977V10.0852V10.0727V10.0602V10.0477V10.0352V10.0227V10.0102V9.99765V9.98515V9.97264V9.96014V9.94763V9.93512V9.92262V9.91011V9.8976V9.88509V9.87258V9.86007V9.84756V9.83505V9.82254V9.81002V9.79751V9.785V9.77248V9.75997V9.74745V9.73494V9.72242V9.7099V9.69738V9.68486V9.67234V9.65982V9.6473V9.63478V9.62226V9.60974V9.59721V9.58469V9.57217V9.55964V9.54711V9.53459V9.52206V9.50953V9.497V9.48447V9.47194V9.45941V9.44688V9.43435V9.42182V9.40928V9.39675V9.38421V9.37168V9.35914V9.34661V9.33407V9.32153V9.30899V9.29645V9.28391V9.27137V9.25883V9.24628V9.23374V9.22119V9.20865V9.1961V9.18356V9.17101V9.15846V9.14591V9.13336V9.12081V9.10826V9.09571V9.08316V9.0706V9.05805V9.04549V9.03294V9.02038V9.00782V8.99527V8.98271V8.97015V8.95759V8.94503V8.93246V8.9199V8.90734V8.89477V8.88221V8.86964V8.85707V8.8445V8.83194V8.81937V8.8068V8.79422V8.78165V8.76908V8.75651V8.74393V8.73136V8.71878V8.7062V8.69362V8.68104V8.66846V8.65588V8.6433V8.63072V8.61814V8.60555V8.59297V8.58038V8.56779V8.55521V8.54262V8.53003V8.51744V8.50485V8.49225V8.47966V8.46707V8.45447V8.44187V8.42928V8.41668V8.40408V8.39148V8.37888V8.36628V8.35368V8.34107V8.32847V8.31586V8.30326V8.29065V8.27804V8.26543V8.25282V8.24021V8.2276V8.21499V8.20237V8.18976V8.17714V8.16452V8.15191V8.13929V8.12667V8.11405V8.10142V8.0888V8.07618V8.06355V8.05093V8.0383V8.02567V8.01304V8.00041V7.98778V7.97515V7.96252V7.94988V7.93725V7.92461V7.91197V7.89933V7.88669V7.87405V7.86141V7.84877V7.83613V7.82348V7.81084V7.79819V7.78554V7.77289V7.76024V7.74759V7.73494V7.72229V7.70963V7.69698V7.68432V7.67166V7.659V7.64634V7.63368V7.62102V7.60836V7.59569V7.58303V7.57036V7.55769V7.54502V7.53235V7.51968V7.50701V7.49434V7.48166V7.46899V7.45631V7.44363V7.43095V7.41827V7.40559V7.39291V7.38023V7.36754V7.35486V7.34217V7.32948V7.31679V7.3041V7.29141V7.27872V7.26602V7.25333V7.24063V7.22793V7.21523V7.20253V7.18983V7.17713V7.16442V7.15172V7.13901V7.12631V7.1136V7.10089V7.08818V7.07546V7.06275V7.05003V7.03732V7.0246V7.01188V6.99916V6.98644V6.97372V6.961V6.94827V6.93554V6.92282V6.91009V6.89736V6.88463V6.87189V6.85916V6.84643V6.83369V6.82095V6.80821V6.79547V6.78273V6.76999V6.75724V6.7445V6.73175V6.719V6.70625V6.6935V6.68075V6.668V6.65524V6.64249V6.62973V6.61697V6.60421V6.59145V6.57869V6.56592V6.55316V6.54039V6.52762V6.51575H14.5657H14.5689H14.572H14.5752H14.5784H14.5816H14.5848H14.5879H14.5911H14.5943H14.5975H14.6007H14.6039H14.607H14.6102H14.6134H14.6166H14.6198H14.623H14.6261H14.6293H14.6325H14.6357H14.6389H14.6421H14.6452H14.6484H14.6516H14.6548H14.658H14.6612H14.6644H14.6675H14.6707H14.6739H14.6771H14.6803H14.6835H14.6867H14.6898H14.693H14.6962H14.6994H14.7026H14.7058H14.709H14.7122H14.7153H14.7185H14.7217H14.7249H14.7281H14.7313H14.7345H14.7377H14.7408H14.744H14.7472H14.7504H14.7536H14.7568H14.76H14.7632H14.7664H14.7696H14.7727H14.7759H14.7791H14.7823H14.7855H14.7887H14.7919H14.7951H14.7983H14.8015H14.8047H14.8078H14.811H14.8142H14.8174H14.8206H14.8238H14.827H14.8302H14.8334H14.8366H14.8398H14.843H14.8462H14.8494H14.8526H14.8558H14.859H14.8621H14.8653H14.8685H14.8717H14.8749H14.8781H14.8813H14.8845H14.8877H14.8909H14.8941H14.8973H14.9005H14.9037H14.9069H14.9101H14.9133H14.9165H14.9197H14.9229H14.9261H14.9293H14.9325H14.9357H14.9389H14.9421H14.9453H14.9485H14.9517H14.9549H14.9581H14.9613H14.9645H14.9677H14.9709H14.9741H14.9773H14.9805H14.9837H14.9869H14.9901H14.9933H14.9965H14.9997H15.0029H15.0061H15.0093H15.0125H15.0158H15.019H15.0222H15.0254H15.0286H15.0318H15.035H15.0382H15.0414H15.0446H15.0478H15.051H15.0542H15.0574H15.0606H15.0639H15.0671H15.0703H15.0735H15.0767H15.0799H15.0831H15.0863H15.0895H15.0927H15.0959H15.0992H15.1024H15.1056H15.1088H15.112H15.1152H15.1184H15.1216H15.1249H15.1281H15.1313H15.1345H15.1377H15.1409H15.1441H15.1474H15.1506H15.1538H15.157H15.1602H15.1634H15.1666H15.1699H15.1731H15.1763H15.1795H15.1827H15.1859H15.1892H15.1924H15.1956H15.1988H15.202H15.2046V6.52616V6.53861V6.55107V6.56352V6.57597V6.58842V6.60087V6.61332V6.62577V6.63822V6.65068V6.66313V6.67558V6.68803V6.70049V6.71294V6.72539V6.73784V6.7503V6.76275V6.7752V6.78766V6.80011V6.81257V6.82502V6.83747V6.84993V6.86238V6.87484V6.88729V6.89975V6.9122V6.92466V6.93712V6.94957V6.96203V6.97449V6.98694V6.9994V7.01186V7.02431V7.03677V7.04923V7.06169V7.07415V7.08661V7.09906V7.11152V7.12398V7.13644V7.1489V7.16136V7.17382V7.18628V7.19875V7.21121V7.22367V7.23613V7.24859V7.26105V7.27352V7.28598V7.29844V7.31091V7.32337V7.33584V7.3483V7.36076V7.37323V7.3857V7.39816V7.41063V7.42309V7.43556V7.44803V7.46049V7.47296V7.48543V7.4979V7.51037V7.52284V7.53531V7.54778V7.56025V7.57272V7.58519V7.59766V7.61013V7.6226V7.63507V7.64755V7.66002V7.67249V7.68497V7.69744V7.70992V7.72239V7.73487V7.74734V7.75982V7.7723V7.78477V7.79725V7.80973V7.82221V7.83468V7.84716V7.85964V7.87212V7.8846V7.89708V7.90957V7.92205V7.93453V7.94701V7.9595V7.97198V7.98446V7.99695V8.00943V8.02192V8.0344V8.04689V8.05938V8.07186V8.08435V8.09684V8.10933V8.12182V8.13431V8.1468V8.15929V8.17178V8.18427V8.19676V8.20925V8.22175V8.23424V8.24673V8.25923V8.27172V8.28422V8.29672V8.30921V8.32171V8.33421V8.3467V8.3592V8.3717V8.3842V8.3967V8.4092V8.42171V8.43421V8.44671V8.45921V8.47172V8.48422V8.49673V8.50923V8.52174V8.53425V8.54675V8.55926V8.57177V8.58428V8.59679V8.6093V8.62181V8.63432V8.64683V8.65934V8.67186V8.68437V8.69689V8.7094V8.72192V8.73443V8.74695V8.75947V8.77198V8.7845V8.79702V8.80954V8.82206V8.83459V8.84711V8.85963V8.87215V8.88468V8.8972V8.90973V8.92225V8.93478V8.94731V8.95984V8.97236V8.98489V8.99742V9.00995V9.02249V9.03502V9.04755V9.06008V9.07262V9.08515V9.09769V9.11023V9.12276V9.1353V9.14784V9.16038V9.17292V9.18546V9.198V9.21054V9.22308V9.23563V9.24817V9.26072V9.27326V9.28581V9.29836V9.31091V9.32345V9.336V9.34855V9.36111V9.37366V9.38621V9.39876V9.41132V9.42387V9.43643V9.44899V9.46154V9.4741V9.48666V9.49922V9.51178V9.52434V9.5369V9.54947V9.56203V9.5746V9.58716V9.59973V9.6123V9.62486V9.63743V9.65V9.66257V9.67514V9.68772V9.70029V9.71286V9.72544V9.73801V9.75059V9.76317V9.77574V9.78832V9.8009V9.81348V9.82607V9.83865V9.85123V9.86382V9.8764V9.88899V9.90157V9.91416V9.92675V9.93934V9.95193V9.96452V9.97711V9.98971V10.0023V10.0149V10.0275V10.0401V10.0527V10.0653V10.0779V10.0905V10.1031V10.1157V10.1283V10.1409V10.1535V10.1661V10.1787V10.1913V10.2039V10.2165V10.2292V10.2418V10.2544V10.267V10.2796V10.2922V10.3048V10.3175V10.3301V10.3427V10.3553V10.3679V10.3806V10.3932V10.4058V10.4184V10.4311V10.4437V10.4563V10.469V10.4816V10.4942V10.5069V10.5195V10.5321V10.5448V10.5574V10.57V10.5827V10.5953V10.608V10.6206V10.6332V10.6459V10.6585V10.6712V10.6838V10.6965V10.7091V10.7218V10.7344V10.7471V10.7597V10.7724V10.785V10.7977V10.8104V10.823V10.8357V10.8483V10.861V10.8737V10.8863V10.899V10.9117V10.9243V10.937V10.9497V10.9624V10.975V10.9877V11.0004V11.0131V11.0257V11.0384V11.0511V11.0638V11.0765V11.0891V11.1018V11.1145V11.1272V11.1399V11.1526V11.1653V11.178V11.1907V11.2033V11.216V11.2287V11.2414V11.2541V11.2668V11.2795V11.2922V11.3049V11.3176V11.3304V11.3431V11.3558V11.3685V11.3812V11.3939V11.4066V11.4193V11.432V11.4448V11.4575V11.4702V11.4829V11.4956V11.5084V11.5211V11.5338V11.5466V11.5593V11.572V11.5847V11.5975V11.6102V11.6229V11.6357V11.6484V11.6612V11.6739V11.6866V11.6994V11.7121V11.7249V11.7376V11.7504V11.7631V11.7759V11.7886V11.8014V11.8141V11.8269V11.8396V11.8524V11.8652V11.8779V11.8907V11.9034V11.9162V11.929V11.9417V11.9536H15.2029H15.1997H15.1965H15.1933H15.1902H15.187H15.1838H15.1806H15.1774H15.1742H15.1711H15.1679H15.1647H15.1615H15.1583H15.1551H15.152H15.1488H15.1456H15.1424H15.1392H15.136H15.1329H15.1297H15.1265H15.1233H15.1201H15.1169H15.1138H15.1106H15.1074H15.1042H15.101H15.0978H15.0946H15.0915H15.0883H15.0851H15.0819H15.0787H15.0755H15.0723H15.0692H15.066H15.0628H15.0596H15.0564H15.0532H15.05H15.0468H15.0437H15.0405H15.0373H15.0341H15.0309H15.0277H15.0245H15.0213H15.0181H15.015H15.0118H15.0086H15.0054H15.0022H14.999H14.9958H14.9926H14.9894H14.9862H14.983H14.9799H14.9767H14.9735H14.9703H14.9671H14.9639H14.9607H14.9575H14.9543H14.9511H14.9479H14.9447H14.9415H14.9384H14.9352H14.932H14.9288H14.9256H14.9224H14.9192H14.916H14.9128H14.9096H14.9064H14.9032H14.9H14.8968H14.8936H14.8904H14.8872H14.884H14.8808H14.8776H14.8744H14.8712H14.8681H14.8649H14.8617H14.8585H14.8553H14.8521H14.8489H14.8457H14.8425H14.8393H14.8361H14.8329H14.8297H14.8265H14.8233H14.8201H14.8169H14.8137H14.8105H14.8073H14.8041H14.8009H14.7977H14.7945H14.7912H14.788H14.7848H14.7816H14.7784H14.7752H14.772H14.7688H14.7656H14.7624H14.7592H14.756H14.7528H14.7496H14.7464H14.7432H14.74H14.7368H14.7336H14.7304H14.7272H14.7239H14.7207H14.7175H14.7143H14.7111H14.7079H14.7047H14.7015H14.6983H14.6951H14.6919H14.6887H14.6854H14.6822H14.679H14.6758H14.6726H14.6694H14.6662H14.663H14.6598H14.6565H14.6533H14.6501H14.6469H14.6437H14.6405H14.6373H14.6341H14.6308H14.6276H14.6244H14.6212H14.618H14.6148H14.6116H14.6083H14.6051H14.6019H14.5987H14.5955H14.5923H14.589H14.5858H14.5826H14.5794H14.5762H14.573H14.5697H14.5665H14.564Z"
            fill="black"
            stroke={props.color}
          />
          <Path
            d="M13.4741 17.5V17.4972V17.4894V17.4817V17.474V17.4662V17.4585V17.4508V17.443V17.4353V17.4275V17.4198V17.4121V17.4043V17.3966V17.3888V17.3811V17.3734V17.3656V17.3579V17.3501V17.3424V17.3347V17.3269V17.3192V17.3114V17.3037V17.2959V17.2882V17.2805V17.2727V17.265V17.2572V17.2495V17.2418V17.234V17.2263V17.2185V17.2108V17.203V17.1953V17.1875V17.1798V17.1721V17.1643V17.1566V17.1488V17.1411V17.1333V17.1256V17.1178V17.1101V17.1023V17.0946V17.0869V17.0791V17.0714V17.0636V17.0559V17.0481V17.0404V17.0326V17.0249V17.0171V17.0094V17.0016V16.9939V16.9861V16.9784V16.9706V16.9629V16.9551V16.9474V16.9396V16.9319V16.9241V16.9164V16.9086V16.9009V16.8931V16.8854V16.8776V16.8699V16.8621V16.8543V16.8466V16.8388V16.8311V16.8233V16.8156V16.8078V16.8001V16.7923V16.7845V16.7768V16.769V16.7613V16.7535V16.7458V16.738V16.7302V16.7225V16.7147V16.707V16.6992V16.6915V16.6837V16.6759V16.6682V16.6604V16.6526V16.6449V16.6371V16.6294V16.6216V16.6138V16.6061V16.5983V16.5905V16.5828V16.575V16.5673V16.5595V16.5517V16.544V16.5362V16.5284V16.5207V16.5129V16.5051V16.4974V16.4896V16.4818V16.474V16.4663V16.4585V16.4507V16.443V16.4352V16.4274V16.4197V16.4119V16.4041V16.3963V16.3886V16.3808V16.373V16.3652V16.3575V16.3497V16.3419V16.3341V16.3264V16.3186V16.3108V16.303V16.2953V16.2875V16.2797V16.2719V16.2642V16.2564V16.2486V16.2408V16.233V16.2252V16.2175V16.2097V16.2019V16.1941V16.1863V16.1786V16.1708V16.163V16.1552V16.1474V16.1396V16.1318V16.1241V16.1163V16.1085V16.1007V16.0929V16.0851V16.0773V16.0695V16.0617V16.054V16.0462V16.0384V16.0306V16.0228V16.015V16.0072V15.9994V15.9916V15.9838V15.976V15.9682V15.9604V15.9526V15.9448V15.937V15.9292V15.9215V15.9137V15.9059V15.8981V15.8903V15.8825V15.8747V15.8668V15.859V15.8512V15.8434V15.8356V15.8278V15.82V15.8122V15.8044V15.7966V15.7888V15.781V15.7732V15.7654V15.7576V15.7498V15.742V15.7341V15.7263V15.7185V15.7107V15.7029V15.6951V15.6873V15.6795V15.6716V15.6638V15.656V15.6482V15.6404V15.6326V15.6247V15.6169V15.6091V15.6013V15.5935V15.5856V15.5778V15.57V15.5622V15.5544V15.5465V15.5387V15.5309V15.5231V15.5152V15.5074V15.4996V15.4918V15.4839V15.4761V15.4683V15.4604V15.4526V15.4448V15.4369V15.4291V15.4213V15.4134V15.4056V15.3978V15.3899V15.3821V15.3743V15.3664V15.3586V15.3508V15.3429V15.3351V15.3272V15.3194V15.3116V15.3037V15.2959V15.288V15.2802V15.2723V15.2645V15.2567V15.2488V15.241V15.2331V15.2253V15.2174V15.2096V15.2017V15.1939V15.186V15.1782V15.1703V15.1625V15.1546V15.1468V15.1389V15.131V15.1232V15.1153V15.1075V15.0996V15.0918V15.0839V15.076V15.0682V15.0603V15.0524V15.0446V15.0367V15.0289V15.021V15.0131V15.0053V14.9974V14.9895V14.9817V14.9738V14.9659V14.958V14.9502V14.9423V14.9344V14.9266V14.9187V14.9108V14.9029V14.8951V14.8872V14.8793V14.8714V14.8635V14.8557V14.8478V14.8399V14.832V14.8241V14.8163V14.8084V14.8005V14.7926V14.7847V14.7768V14.7689V14.761V14.7532V14.7453V14.7374V14.7295V14.7216V14.7137V14.7058V14.6979V14.69V14.6821V14.6742V14.6663V14.6584V14.6505V14.6426V14.6347V14.6268V14.6189V14.611V14.6031V14.5952V14.5873V14.5794V14.5715V14.5636V14.5557V14.5478V14.5399V14.5319V14.524V14.5161V14.5082V14.5003V14.5H13.4772H13.4811H13.4849H13.4888H13.4927H13.4966H13.5004H13.5043H13.5082H13.5121H13.5159H13.5198H13.5237H13.5276H13.5314H13.5353H13.5392H13.5431H13.5469H13.5508H13.5547H13.5586H13.5625H13.5663H13.5702H13.5741H13.578H13.5818H13.5857H13.5896H13.5935H13.5974H13.6012H13.6051H13.609H13.6129H13.6168H13.6206H13.6245H13.6284H13.6323H13.6362H13.64H13.6439H13.6478H13.6517H13.6556H13.6594H13.6633H13.6672H13.6711H13.675H13.6788H13.6827H13.6866H13.6905H13.6944H13.6983H13.7021H13.706H13.7099H13.7138H13.7177H13.7216H13.7254H13.7293H13.7332H13.7371H13.741H13.7449H13.7488H13.7526H13.7565H13.7604H13.7643H13.7682H13.7721H13.776H13.7798H13.7837H13.7876H13.7915H13.7954H13.7993H13.8032H13.807H13.8109H13.8148H13.8187H13.8226H13.8265H13.8304H13.8343H13.8382H13.842H13.8459H13.8498H13.8537H13.8576H13.8615H13.8654H13.8693H13.8732H13.8771H13.881H13.8848H13.8887H13.8926H13.8965H13.9004H13.9043H13.9082H13.9121H13.916H13.9199H13.9238H13.9277H13.9316H13.9355H13.9394H13.9432H13.9471H13.951H13.9549H13.9588H13.9627H13.9666H13.9705H13.9744H13.9783H13.9822H13.9861H13.99H13.9939H13.9978H14.0017H14.0056H14.0095H14.0134H14.0173H14.0212H14.0251H14.029H14.0329H14.0368H14.0407H14.0446H14.0485H14.0524H14.0563H14.0602H14.0641H14.068H14.0719H14.0758H14.0797H14.0836H14.0875H14.0914H14.0953H14.0992H14.1031H14.107H14.111H14.1149H14.1188H14.1227H14.1266H14.1305H14.1344H14.1383H14.1422H14.1461H14.15H14.1539H14.1578H14.1618H14.1657H14.1696H14.1735H14.1774H14.1813H14.1852H14.1891H14.193H14.1969H14.2009H14.2048H14.2087H14.2126H14.2165H14.2204H14.2243H14.2282H14.2322H14.2361H14.24H14.2439H14.2478H14.2517H14.2556H14.2596H14.2635H14.2674H14.2713H14.2752H14.2791H14.2831H14.287H14.2909H14.2948H14.2987H14.3027H14.3066H14.3105H14.3144H14.3183H14.3223H14.3262H14.3301H14.334H14.3379H14.3419H14.3458H14.3497H14.3536H14.3576H14.3615H14.3654H14.3693H14.3733H14.3772H14.3811H14.385H14.389H14.3929H14.3968H14.4007H14.4047H14.4086H14.4125H14.4165H14.4204H14.4243H14.4282H14.4322H14.4361H14.44H14.444H14.4479H14.4518H14.4558H14.4597H14.4636H14.4676H14.4715H14.4741V14.5028V14.5106V14.5183V14.526V14.5338V14.5415V14.5492V14.557V14.5647V14.5725V14.5802V14.5879V14.5957V14.6034V14.6112V14.6189V14.6266V14.6344V14.6421V14.6499V14.6576V14.6653V14.6731V14.6808V14.6886V14.6963V14.7041V14.7118V14.7195V14.7273V14.735V14.7428V14.7505V14.7582V14.766V14.7737V14.7815V14.7892V14.797V14.8047V14.8125V14.8202V14.8279V14.8357V14.8434V14.8512V14.8589V14.8667V14.8744V14.8822V14.8899V14.8977V14.9054V14.9131V14.9209V14.9286V14.9364V14.9441V14.9519V14.9596V14.9674V14.9751V14.9829V14.9906V14.9984V15.0061V15.0139V15.0216V15.0294V15.0371V15.0449V15.0526V15.0604V15.0681V15.0759V15.0836V15.0914V15.0991V15.1069V15.1146V15.1224V15.1301V15.1379V15.1457V15.1534V15.1612V15.1689V15.1767V15.1844V15.1922V15.1999V15.2077V15.2155V15.2232V15.231V15.2387V15.2465V15.2542V15.262V15.2698V15.2775V15.2853V15.293V15.3008V15.3085V15.3163V15.3241V15.3318V15.3396V15.3474V15.3551V15.3629V15.3706V15.3784V15.3862V15.3939V15.4017V15.4095V15.4172V15.425V15.4327V15.4405V15.4483V15.456V15.4638V15.4716V15.4793V15.4871V15.4949V15.5026V15.5104V15.5182V15.526V15.5337V15.5415V15.5493V15.557V15.5648V15.5726V15.5803V15.5881V15.5959V15.6037V15.6114V15.6192V15.627V15.6348V15.6425V15.6503V15.6581V15.6659V15.6736V15.6814V15.6892V15.697V15.7047V15.7125V15.7203V15.7281V15.7358V15.7436V15.7514V15.7592V15.767V15.7748V15.7825V15.7903V15.7981V15.8059V15.8137V15.8214V15.8292V15.837V15.8448V15.8526V15.8604V15.8682V15.8759V15.8837V15.8915V15.8993V15.9071V15.9149V15.9227V15.9305V15.9383V15.946V15.9538V15.9616V15.9694V15.9772V15.985V15.9928V16.0006V16.0084V16.0162V16.024V16.0318V16.0396V16.0474V16.0552V16.063V16.0708V16.0785V16.0863V16.0941V16.1019V16.1097V16.1175V16.1253V16.1332V16.141V16.1488V16.1566V16.1644V16.1722V16.18V16.1878V16.1956V16.2034V16.2112V16.219V16.2268V16.2346V16.2424V16.2502V16.258V16.2659V16.2737V16.2815V16.2893V16.2971V16.3049V16.3127V16.3205V16.3284V16.3362V16.344V16.3518V16.3596V16.3674V16.3753V16.3831V16.3909V16.3987V16.4065V16.4144V16.4222V16.43V16.4378V16.4456V16.4535V16.4613V16.4691V16.4769V16.4848V16.4926V16.5004V16.5082V16.5161V16.5239V16.5317V16.5396V16.5474V16.5552V16.5631V16.5709V16.5787V16.5866V16.5944V16.6022V16.6101V16.6179V16.6257V16.6336V16.6414V16.6492V16.6571V16.6649V16.6728V16.6806V16.6884V16.6963V16.7041V16.712V16.7198V16.7277V16.7355V16.7433V16.7512V16.759V16.7669V16.7747V16.7826V16.7904V16.7983V16.8061V16.814V16.8218V16.8297V16.8375V16.8454V16.8532V16.8611V16.869V16.8768V16.8847V16.8925V16.9004V16.9082V16.9161V16.924V16.9318V16.9397V16.9476V16.9554V16.9633V16.9711V16.979V16.9869V16.9947V17.0026V17.0105V17.0183V17.0262V17.0341V17.042V17.0498V17.0577V17.0656V17.0734V17.0813V17.0892V17.0971V17.1049V17.1128V17.1207V17.1286V17.1365V17.1443V17.1522V17.1601V17.168V17.1759V17.1837V17.1916V17.1995V17.2074V17.2153V17.2232V17.2311V17.239V17.2468V17.2547V17.2626V17.2705V17.2784V17.2863V17.2942V17.3021V17.31V17.3179V17.3258V17.3337V17.3416V17.3495V17.3574V17.3653V17.3732V17.3811V17.389V17.3969V17.4048V17.4127V17.4206V17.4285V17.4364V17.4443V17.4522V17.4601V17.4681V17.476V17.4839V17.4918V17.4997V17.5H14.4711H14.4672H14.4633H14.4594H14.4556H14.4517H14.4478H14.4439H14.4401H14.4362H14.4323H14.4284H14.4246H14.4207H14.4168H14.4129H14.409H14.4052H14.4013H14.3974H14.3935H14.3897H14.3858H14.3819H14.378H14.3742H14.3703H14.3664H14.3625H14.3586H14.3548H14.3509H14.347H14.3431H14.3392H14.3354H14.3315H14.3276H14.3237H14.3198H14.316H14.3121H14.3082H14.3043H14.3004H14.2966H14.2927H14.2888H14.2849H14.281H14.2772H14.2733H14.2694H14.2655H14.2616H14.2577H14.2539H14.25H14.2461H14.2422H14.2383H14.2345H14.2306H14.2267H14.2228H14.2189H14.215H14.2111H14.2073H14.2034H14.1995H14.1956H14.1917H14.1878H14.1839H14.1801H14.1762H14.1723H14.1684H14.1645H14.1606H14.1567H14.1529H14.149H14.1451H14.1412H14.1373H14.1334H14.1295H14.1256H14.1218H14.1179H14.114H14.1101H14.1062H14.1023H14.0984H14.0945H14.0906H14.0867H14.0829H14.079H14.0751H14.0712H14.0673H14.0634H14.0595H14.0556H14.0517H14.0478H14.0439H14.04H14.0361H14.0323H14.0284H14.0245H14.0206H14.0167H14.0128H14.0089H14.005H14.0011H13.9972H13.9933H13.9894H13.9855H13.9816H13.9777H13.9738H13.9699H13.966H13.9621H13.9582H13.9543H13.9504H13.9465H13.9426H13.9387H13.9348H13.9309H13.927H13.9231H13.9192H13.9153H13.9114H13.9075H13.9036H13.8997H13.8958H13.8919H13.888H13.8841H13.8802H13.8763H13.8724H13.8685H13.8646H13.8607H13.8568H13.8529H13.849H13.8451H13.8412H13.8373H13.8334H13.8295H13.8256H13.8217H13.8178H13.8138H13.8099H13.806H13.8021H13.7982H13.7943H13.7904H13.7865H13.7826H13.7787H13.7748H13.7709H13.7669H13.763H13.7591H13.7552H13.7513H13.7474H13.7435H13.7396H13.7357H13.7317H13.7278H13.7239H13.72H13.7161H13.7122H13.7083H13.7043H13.7004H13.6965H13.6926H13.6887H13.6848H13.6808H13.6769H13.673H13.6691H13.6652H13.6613H13.6573H13.6534H13.6495H13.6456H13.6417H13.6377H13.6338H13.6299H13.626H13.6221H13.6181H13.6142H13.6103H13.6064H13.6024H13.5985H13.5946H13.5907H13.5868H13.5828H13.5789H13.575H13.5711H13.5671H13.5632H13.5593H13.5554H13.5514H13.5475H13.5436H13.5396H13.5357H13.5318H13.5279H13.5239H13.52H13.5161H13.5121H13.5082H13.5043H13.5003H13.4964H13.4925H13.4885H13.4846H13.4807H13.4768H13.4741Z"
            fill="black"
            stroke={props.color}
          />
          <Path
            d="M12.5 15.5396H12.4952H12.4894H12.4836H12.4778H12.472H12.4662H12.4603H12.4545H12.4487H12.4429H12.4371H12.4313H12.4255H12.4197H12.4139H12.4081H12.4023H12.3965H12.3907H12.3849H12.379H12.3732H12.3674H12.3616H12.3558H12.35H12.3442H12.3384H12.3326H12.3268H12.321H12.3151H12.3093H12.3035H12.2977H12.2919H12.2861H12.2803H12.2745H12.2687H12.2628H12.257H12.2512H12.2454H12.2396H12.2338H12.228H12.2222H12.2163H12.2105H12.2047H12.1989H12.1931H12.1873H12.1815H12.1756H12.1698H12.164H12.1582H12.1524H12.1466H12.1408H12.1349H12.1291H12.1233H12.1175H12.1117H12.1059H12.1H12.0942H12.0884H12.0826H12.0768H12.071H12.0651H12.0593H12.0535H12.0477H12.0419H12.036H12.0302H12.0244H12.0186H12.0128H12.0069H12.0011H11.9953H11.9895H11.9837H11.9778H11.972H11.9662H11.9604H11.9546H11.9487H11.9429H11.9371H11.9313H11.9254H11.9196H11.9138H11.908H11.9021H11.8963H11.8905H11.8847H11.8788H11.873H11.8672H11.8614H11.8555H11.8497H11.8439H11.8381H11.8322H11.8264H11.8206H11.8147H11.8089H11.8031H11.7973H11.7914H11.7856H11.7798H11.7739H11.7681H11.7623H11.7564H11.7506H11.7448H11.7389H11.7331H11.7273H11.7214H11.7156H11.7098H11.7039H11.6981H11.6923H11.6864H11.6806H11.6748H11.6689H11.6631H11.6573H11.6514H11.6456H11.6398H11.6339H11.6281H11.6222H11.6164H11.6106H11.6047H11.5989H11.593H11.5872H11.5814H11.5755H11.5697H11.5638H11.558H11.5522H11.5463H11.5405H11.5346H11.5288H11.5229H11.5171H11.5113H11.5054H11.4996H11.4937H11.4879H11.482H11.4762H11.4703H11.4645H11.4586H11.4528H11.4469H11.4411H11.4352H11.4294H11.4235H11.4177H11.4118H11.406H11.4001H11.3943H11.3884H11.3826H11.3767H11.3709H11.365H11.3592H11.3533H11.3475H11.3416H11.3357H11.3299H11.324H11.3182H11.3123H11.3065H11.3006H11.2947H11.2889H11.283H11.2772H11.2713H11.2655H11.2596H11.2537H11.2479H11.242H11.2361H11.2303H11.2244H11.2186H11.2127H11.2068H11.201H11.1951H11.1892H11.1834H11.1775H11.1716H11.1658H11.1599H11.154H11.1482H11.1423H11.1364H11.1306H11.1247H11.1188H11.1129H11.1071H11.1012H11.0953H11.0895H11.0836H11.0777H11.0718H11.066H11.0601H11.0542H11.0483H11.0425H11.0366H11.0307H11.0248H11.0189H11.0131H11.0072H11.0013H10.9954H10.9896H10.9837H10.9778H10.9719H10.966H10.9601H10.9543H10.9484H10.9425H10.9366H10.9307H10.9248H10.919H10.9131H10.9072H10.9013H10.8954H10.8895H10.8836H10.8777H10.8718H10.866H10.8601H10.8542H10.8483H10.8424H10.8365H10.8306H10.8247H10.8188H10.8129H10.807H10.8011H10.7952H10.7893H10.7834H10.7775H10.7716H10.7657H10.7598H10.7539H10.748H10.7421H10.7362H10.7303H10.7244H10.7185H10.7126H10.7067H10.7008H10.6949H10.689H10.6831H10.6772H10.6713H10.6654H10.6595H10.6536H10.6477H10.6417H10.6358H10.6299H10.624H10.6181H10.6122H10.6063H10.6004H10.5944H10.5885H10.5826H10.5767H10.5708H10.5649H10.5589H10.553H10.5471H10.5412H10.5353H10.5294H10.5234H10.5175H10.5116H10.5057H10.5V15.5365V15.5326V15.5287V15.5249V15.521V15.5171V15.5132V15.5094V15.5055V15.5016V15.4977V15.4939V15.49V15.4861V15.4822V15.4784V15.4745V15.4706V15.4667V15.4628V15.459V15.4551V15.4512V15.4473V15.4435V15.4396V15.4357V15.4318V15.4279V15.4241V15.4202V15.4163V15.4124V15.4086V15.4047V15.4008V15.3969V15.393V15.3892V15.3853V15.3814V15.3775V15.3736V15.3698V15.3659V15.362V15.3581V15.3542V15.3504V15.3465V15.3426V15.3387V15.3348V15.3309V15.3271V15.3232V15.3193V15.3154V15.3115V15.3076V15.3038V15.2999V15.296V15.2921V15.2882V15.2843V15.2805V15.2766V15.2727V15.2688V15.2649V15.261V15.2572V15.2533V15.2494V15.2455V15.2416V15.2377V15.2338V15.2299V15.2261V15.2222V15.2183V15.2144V15.2105V15.2066V15.2027V15.1988V15.195V15.1911V15.1872V15.1833V15.1794V15.1755V15.1716V15.1677V15.1638V15.16V15.1561V15.1522V15.1483V15.1444V15.1405V15.1366V15.1327V15.1288V15.1249V15.121V15.1172V15.1133V15.1094V15.1055V15.1016V15.0977V15.0938V15.0899V15.086V15.0821V15.0782V15.0743V15.0704V15.0665V15.0626V15.0587V15.0548V15.0509V15.0471V15.0432V15.0393V15.0354V15.0315V15.0276V15.0237V15.0198V15.0159V15.012V15.0081V15.0042V15.0003V14.9964V14.9925V14.9886V14.9847V14.9808V14.9769V14.973V14.9691V14.9652V14.9613V14.9574V14.9535V14.9496V14.9457V14.9418V14.9379V14.934V14.93V14.9261V14.9222V14.9183V14.9144V14.9105V14.9066V14.9027V14.8988V14.8949V14.891V14.8871V14.8832V14.8793V14.8754V14.8715V14.8676V14.8636V14.8597V14.8558V14.8519V14.848V14.8441V14.8402V14.8363V14.8324V14.8285V14.8246V14.8206V14.8167V14.8128V14.8089V14.805V14.8011V14.7972V14.7933V14.7893V14.7854V14.7815V14.7776V14.7737V14.7698V14.7659V14.7619V14.758V14.7541V14.7502V14.7463V14.7424V14.7384V14.7345V14.7306V14.7267V14.7228V14.7189V14.7149V14.711V14.7071V14.7032V14.6993V14.6953V14.6914V14.6875V14.6836V14.6796V14.6757V14.6718V14.6679V14.664V14.66V14.6561V14.6522V14.6483V14.6443V14.6404V14.6365V14.6326V14.6286V14.6247V14.6208V14.6169V14.6129V14.609V14.6051V14.6011V14.5972V14.5933V14.5894V14.5854V14.5815V14.5776V14.5736V14.5697V14.5658V14.5618V14.5579V14.554V14.55V14.5461V14.5422V14.5396H10.5048H10.5106H10.5164H10.5222H10.528H10.5338H10.5397H10.5455H10.5513H10.5571H10.5629H10.5687H10.5745H10.5803H10.5861H10.5919H10.5977H10.6035H10.6093H10.6151H10.621H10.6268H10.6326H10.6384H10.6442H10.65H10.6558H10.6616H10.6674H10.6732H10.679H10.6849H10.6907H10.6965H10.7023H10.7081H10.7139H10.7197H10.7255H10.7313H10.7372H10.743H10.7488H10.7546H10.7604H10.7662H10.772H10.7778H10.7837H10.7895H10.7953H10.8011H10.8069H10.8127H10.8185H10.8244H10.8302H10.836H10.8418H10.8476H10.8534H10.8592H10.8651H10.8709H10.8767H10.8825H10.8883H10.8941H10.9H10.9058H10.9116H10.9174H10.9232H10.929H10.9349H10.9407H10.9465H10.9523H10.9581H10.964H10.9698H10.9756H10.9814H10.9872H10.9931H10.9989H11.0047H11.0105H11.0163H11.0222H11.028H11.0338H11.0396H11.0454H11.0513H11.0571H11.0629H11.0687H11.0746H11.0804H11.0862H11.092H11.0979H11.1037H11.1095H11.1153H11.1212H11.127H11.1328H11.1386H11.1445H11.1503H11.1561H11.1619H11.1678H11.1736H11.1794H11.1853H11.1911H11.1969H11.2027H11.2086H11.2144H11.2202H11.2261H11.2319H11.2377H11.2436H11.2494H11.2552H11.2611H11.2669H11.2727H11.2786H11.2844H11.2902H11.2961H11.3019H11.3077H11.3136H11.3194H11.3252H11.3311H11.3369H11.3427H11.3486H11.3544H11.3602H11.3661H11.3719H11.3778H11.3836H11.3894H11.3953H11.4011H11.407H11.4128H11.4186H11.4245H11.4303H11.4362H11.442H11.4478H11.4537H11.4595H11.4654H11.4712H11.4771H11.4829H11.4887H11.4946H11.5004H11.5063H11.5121H11.518H11.5238H11.5297H11.5355H11.5414H11.5472H11.5531H11.5589H11.5648H11.5706H11.5765H11.5823H11.5882H11.594H11.5999H11.6057H11.6116H11.6174H11.6233H11.6291H11.635H11.6408H11.6467H11.6525H11.6584H11.6643H11.6701H11.676H11.6818H11.6877H11.6935H11.6994H11.7053H11.7111H11.717H11.7228H11.7287H11.7345H11.7404H11.7463H11.7521H11.758H11.7639H11.7697H11.7756H11.7814H11.7873H11.7932H11.799H11.8049H11.8108H11.8166H11.8225H11.8284H11.8342H11.8401H11.846H11.8518H11.8577H11.8636H11.8694H11.8753H11.8812H11.8871H11.8929H11.8988H11.9047H11.9105H11.9164H11.9223H11.9282H11.934H11.9399H11.9458H11.9517H11.9575H11.9634H11.9693H11.9752H11.9811H11.9869H11.9928H11.9987H12.0046H12.0104H12.0163H12.0222H12.0281H12.034H12.0399H12.0457H12.0516H12.0575H12.0634H12.0693H12.0752H12.081H12.0869H12.0928H12.0987H12.1046H12.1105H12.1164H12.1223H12.1282H12.134H12.1399H12.1458H12.1517H12.1576H12.1635H12.1694H12.1753H12.1812H12.1871H12.193H12.1989H12.2048H12.2107H12.2166H12.2225H12.2284H12.2343H12.2402H12.2461H12.252H12.2579H12.2638H12.2697H12.2756H12.2815H12.2874H12.2933H12.2992H12.3051H12.311H12.3169H12.3228H12.3287H12.3346H12.3405H12.3464H12.3523H12.3583H12.3642H12.3701H12.376H12.3819H12.3878H12.3937H12.3996H12.4056H12.4115H12.4174H12.4233H12.4292H12.4351H12.4411H12.447H12.4529H12.4588H12.4647H12.4706H12.4766H12.4825H12.4884H12.4943H12.5V14.5426V14.5465V14.5504V14.5542V14.5581V14.562V14.5659V14.5697V14.5736V14.5775V14.5814V14.5852V14.5891V14.593V14.5969V14.6007V14.6046V14.6085V14.6124V14.6163V14.6201V14.624V14.6279V14.6318V14.6356V14.6395V14.6434V14.6473V14.6512V14.655V14.6589V14.6628V14.6667V14.6705V14.6744V14.6783V14.6822V14.6861V14.6899V14.6938V14.6977V14.7016V14.7055V14.7093V14.7132V14.7171V14.721V14.7249V14.7288V14.7326V14.7365V14.7404V14.7443V14.7482V14.752V14.7559V14.7598V14.7637V14.7676V14.7715V14.7753V14.7792V14.7831V14.787V14.7909V14.7948V14.7986V14.8025V14.8064V14.8103V14.8142V14.8181V14.822V14.8258V14.8297V14.8336V14.8375V14.8414V14.8453V14.8492V14.853V14.8569V14.8608V14.8647V14.8686V14.8725V14.8764V14.8803V14.8841V14.888V14.8919V14.8958V14.8997V14.9036V14.9075V14.9114V14.9153V14.9191V14.923V14.9269V14.9308V14.9347V14.9386V14.9425V14.9464V14.9503V14.9542V14.9581V14.962V14.9658V14.9697V14.9736V14.9775V14.9814V14.9853V14.9892V14.9931V14.997V15.0009V15.0048V15.0087V15.0126V15.0165V15.0204V15.0243V15.0282V15.0321V15.0359V15.0398V15.0437V15.0476V15.0515V15.0554V15.0593V15.0632V15.0671V15.071V15.0749V15.0788V15.0827V15.0866V15.0905V15.0944V15.0983V15.1022V15.1061V15.11V15.1139V15.1178V15.1217V15.1256V15.1295V15.1334V15.1373V15.1412V15.1451V15.1491V15.153V15.1569V15.1608V15.1647V15.1686V15.1725V15.1764V15.1803V15.1842V15.1881V15.192V15.1959V15.1998V15.2037V15.2076V15.2115V15.2155V15.2194V15.2233V15.2272V15.2311V15.235V15.2389V15.2428V15.2467V15.2506V15.2545V15.2585V15.2624V15.2663V15.2702V15.2741V15.278V15.2819V15.2858V15.2898V15.2937V15.2976V15.3015V15.3054V15.3093V15.3132V15.3172V15.3211V15.325V15.3289V15.3328V15.3367V15.3407V15.3446V15.3485V15.3524V15.3563V15.3603V15.3642V15.3681V15.372V15.3759V15.3798V15.3838V15.3877V15.3916V15.3955V15.3995V15.4034V15.4073V15.4112V15.4151V15.4191V15.423V15.4269V15.4308V15.4348V15.4387V15.4426V15.4465V15.4505V15.4544V15.4583V15.4622V15.4662V15.4701V15.474V15.478V15.4819V15.4858V15.4897V15.4937V15.4976V15.5015V15.5055V15.5094V15.5133V15.5173V15.5212V15.5251V15.5291V15.533V15.5369V15.5396Z"
            fill="black"
            stroke={props.color}
          />
          <Path
            d="M22.5 18.5H22.5048H22.5106H22.5164H22.5222H22.528H22.5338H22.5397H22.5455H22.5513H22.5571H22.5629H22.5687H22.5745H22.5803H22.5861H22.5919H22.5977H22.6035H22.6093H22.6151H22.621H22.6268H22.6326H22.6384H22.6442H22.65H22.6558H22.6616H22.6674H22.6732H22.679H22.6849H22.6907H22.6965H22.7023H22.7081H22.7139H22.7197H22.7255H22.7313H22.7372H22.743H22.7488H22.7546H22.7604H22.7662H22.772H22.7778H22.7837H22.7895H22.7953H22.8011H22.8069H22.8127H22.8185H22.8244H22.8302H22.836H22.8418H22.8476H22.8534H22.8592H22.8651H22.8709H22.8767H22.8825H22.8883H22.8941H22.9H22.9058H22.9116H22.9174H22.9232H22.929H22.9349H22.9407H22.9465H22.9523H22.9581H22.964H22.9698H22.9756H22.9814H22.9872H22.9931H22.9989H23.0047H23.0105H23.0163H23.0222H23.028H23.0338H23.0396H23.0454H23.0513H23.0571H23.0629H23.0687H23.0746H23.0804H23.0862H23.092H23.0979H23.1037H23.1095H23.1153H23.1212H23.127H23.1328H23.1386H23.1445H23.1503H23.1561H23.1619H23.1678H23.1736H23.1794H23.1853H23.1911H23.1969H23.2027H23.2086H23.2144H23.2202H23.2261H23.2319H23.2377H23.2436H23.2494H23.2552H23.2611H23.2669H23.2727H23.2786H23.2844H23.2902H23.2961H23.3019H23.3077H23.3136H23.3194H23.3252H23.3311H23.3369H23.3427H23.3486H23.3544H23.3602H23.3661H23.3719H23.3778H23.3836H23.3894H23.3953H23.4011H23.407H23.4128H23.4186H23.4245H23.4303H23.4362H23.442H23.4478H23.4537H23.4595H23.4654H23.4712H23.4771H23.4829H23.4887H23.4946H23.5004H23.5063H23.5121H23.518H23.5238H23.5297H23.5355H23.5414H23.5472H23.5531H23.5589H23.5648H23.5706H23.5765H23.5823H23.5882H23.594H23.5999H23.6057H23.6116H23.6174H23.6233H23.6291H23.635H23.6408H23.6467H23.6525H23.6584H23.6643H23.6701H23.676H23.6818H23.6877H23.6935H23.6994H23.7053H23.7111H23.717H23.7228H23.7287H23.7345H23.7404H23.7463H23.7521H23.758H23.7639H23.7697H23.7756H23.7814H23.7873H23.7932H23.799H23.8049H23.8108H23.8166H23.8225H23.8284H23.8342H23.8401H23.846H23.8518H23.8577H23.8636H23.8694H23.8753H23.8812H23.8871H23.8929H23.8988H23.9047H23.9105H23.9164H23.9223H23.9282H23.934H23.9399H23.9458H23.9517H23.9575H23.9634H23.9693H23.9752H23.9811H23.9869H23.9928H23.9987H24.0046H24.0104H24.0163H24.0222H24.0281H24.034H24.0399H24.0457H24.0516H24.0575H24.0634H24.0693H24.0752H24.081H24.0869H24.0928H24.0987H24.1046H24.1105H24.1164H24.1223H24.1282H24.134H24.1399H24.1458H24.1517H24.1576H24.1635H24.1694H24.1753H24.1812H24.1871H24.193H24.1989H24.2048H24.2107H24.2166H24.2225H24.2284H24.2343H24.2402H24.2461H24.252H24.2579H24.2638H24.2697H24.2756H24.2815H24.2874H24.2933H24.2992H24.3051H24.311H24.3169H24.3228H24.3287H24.3346H24.3405H24.3464H24.3523H24.3583H24.3642H24.3701H24.376H24.3819H24.3878H24.3937H24.3996H24.4056H24.4115H24.4174H24.4233H24.4292H24.4351H24.4411H24.447H24.4529H24.4588H24.4647H24.4706H24.4766H24.4825H24.4884H24.4943H24.5V18.5028V18.5106V18.5183V18.526V18.5338V18.5415V18.5492V18.557V18.5647V18.5725V18.5802V18.5879V18.5957V18.6034V18.6112V18.6189V18.6266V18.6344V18.6421V18.6499V18.6576V18.6653V18.6731V18.6808V18.6886V18.6963V18.7041V18.7118V18.7195V18.7273V18.735V18.7428V18.7505V18.7582V18.766V18.7737V18.7815V18.7892V18.797V18.8047V18.8125V18.8202V18.8279V18.8357V18.8434V18.8512V18.8589V18.8667V18.8744V18.8822V18.8899V18.8977V18.9054V18.9131V18.9209V18.9286V18.9364V18.9441V18.9519V18.9596V18.9674V18.9751V18.9829V18.9906V18.9984V19.0061V19.0139V19.0216V19.0294V19.0371V19.0449V19.0526V19.0604V19.0681V19.0759V19.0836V19.0914V19.0991V19.1069V19.1146V19.1224V19.1301V19.1379V19.1457V19.1534V19.1612V19.1689V19.1767V19.1844V19.1922V19.1999V19.2077V19.2155V19.2232V19.231V19.2387V19.2465V19.2542V19.262V19.2698V19.2775V19.2853V19.293V19.3008V19.3085V19.3163V19.3241V19.3318V19.3396V19.3474V19.3551V19.3629V19.3706V19.3784V19.3862V19.3939V19.4017V19.4095V19.4172V19.425V19.4327V19.4405V19.4483V19.456V19.4638V19.4716V19.4793V19.4871V19.4949V19.5026V19.5104V19.5182V19.526V19.5337V19.5415V19.5493V19.557V19.5648V19.5726V19.5803V19.5881V19.5959V19.6037V19.6114V19.6192V19.627V19.6348V19.6425V19.6503V19.6581V19.6659V19.6736V19.6814V19.6892V19.697V19.7047V19.7125V19.7203V19.7281V19.7358V19.7436V19.7514V19.7592V19.767V19.7748V19.7825V19.7903V19.7981V19.8059V19.8137V19.8214V19.8292V19.837V19.8448V19.8526V19.8604V19.8682V19.8759V19.8837V19.8915V19.8993V19.9071V19.9149V19.9227V19.9305V19.9383V19.946V19.9538V19.9616V19.9694V19.9772V19.985V19.9928V20.0006V20.0084V20.0162V20.024V20.0318V20.0396V20.0474V20.0552V20.063V20.0708V20.0785V20.0863V20.0941V20.1019V20.1097V20.1175V20.1253V20.1332V20.141V20.1488V20.1566V20.1644V20.1722V20.18V20.1878V20.1956V20.2034V20.2112V20.219V20.2268V20.2346V20.2424V20.2502V20.258V20.2659V20.2737V20.2815V20.2893V20.2971V20.3049V20.3127V20.3205V20.3284V20.3362V20.344V20.3518V20.3596V20.3674V20.3753V20.3831V20.3909V20.3987V20.4065V20.4144V20.4222V20.43V20.4378V20.4456V20.4535V20.4613V20.4691V20.4769V20.4848V20.4926V20.5004V20.5082V20.5161V20.5239V20.5317V20.5396V20.5474V20.5552V20.5631V20.5709V20.5787V20.5866V20.5944V20.6022V20.6101V20.6179V20.6257V20.6336V20.6414V20.6492V20.6571V20.6649V20.6728V20.6806V20.6884V20.6963V20.7041V20.712V20.7198V20.7277V20.7355V20.7433V20.7512V20.759V20.7669V20.7747V20.7826V20.7904V20.7983V20.8061V20.814V20.8218V20.8297V20.8375V20.8454V20.8532V20.8611V20.869V20.8768V20.8847V20.8925V20.9004V20.9082V20.9161V20.924V20.9318V20.9397V20.9476V20.9554V20.9633V20.9711V20.979V20.9869V20.9947V21.0026V21.0105V21.0183V21.0262V21.0341V21.042V21.0498V21.0577V21.0656V21.0734V21.0813V21.0892V21.0971V21.1049V21.1128V21.1207V21.1286V21.1365V21.1443V21.1522V21.1601V21.168V21.1759V21.1837V21.1916V21.1995V21.2074V21.2153V21.2232V21.2311V21.239V21.2468V21.2547V21.2626V21.2705V21.2784V21.2863V21.2942V21.3021V21.31V21.3179V21.3258V21.3337V21.3416V21.3495V21.3574V21.3653V21.3732V21.3811V21.389V21.3969V21.4048V21.4127V21.4206V21.4285V21.4364V21.4443V21.4522V21.4601V21.4681V21.476V21.4839V21.4918V21.4997V21.5H24.4952H24.4894H24.4836H24.4778H24.472H24.4662H24.4603H24.4545H24.4487H24.4429H24.4371H24.4313H24.4255H24.4197H24.4139H24.4081H24.4023H24.3965H24.3907H24.3849H24.379H24.3732H24.3674H24.3616H24.3558H24.35H24.3442H24.3384H24.3326H24.3268H24.321H24.3151H24.3093H24.3035H24.2977H24.2919H24.2861H24.2803H24.2745H24.2687H24.2628H24.257H24.2512H24.2454H24.2396H24.2338H24.228H24.2222H24.2163H24.2105H24.2047H24.1989H24.1931H24.1873H24.1815H24.1756H24.1698H24.164H24.1582H24.1524H24.1466H24.1408H24.1349H24.1291H24.1233H24.1175H24.1117H24.1059H24.1H24.0942H24.0884H24.0826H24.0768H24.071H24.0651H24.0593H24.0535H24.0477H24.0419H24.036H24.0302H24.0244H24.0186H24.0128H24.0069H24.0011H23.9953H23.9895H23.9837H23.9778H23.972H23.9662H23.9604H23.9546H23.9487H23.9429H23.9371H23.9313H23.9254H23.9196H23.9138H23.908H23.9021H23.8963H23.8905H23.8847H23.8788H23.873H23.8672H23.8614H23.8555H23.8497H23.8439H23.8381H23.8322H23.8264H23.8206H23.8147H23.8089H23.8031H23.7973H23.7914H23.7856H23.7798H23.7739H23.7681H23.7623H23.7564H23.7506H23.7448H23.7389H23.7331H23.7273H23.7214H23.7156H23.7098H23.7039H23.6981H23.6923H23.6864H23.6806H23.6748H23.6689H23.6631H23.6573H23.6514H23.6456H23.6398H23.6339H23.6281H23.6222H23.6164H23.6106H23.6047H23.5989H23.593H23.5872H23.5814H23.5755H23.5697H23.5638H23.558H23.5522H23.5463H23.5405H23.5346H23.5288H23.5229H23.5171H23.5113H23.5054H23.4996H23.4937H23.4879H23.482H23.4762H23.4703H23.4645H23.4586H23.4528H23.4469H23.4411H23.4352H23.4294H23.4235H23.4177H23.4118H23.406H23.4001H23.3943H23.3884H23.3826H23.3767H23.3709H23.365H23.3592H23.3533H23.3475H23.3416H23.3357H23.3299H23.324H23.3182H23.3123H23.3065H23.3006H23.2947H23.2889H23.283H23.2772H23.2713H23.2655H23.2596H23.2537H23.2479H23.242H23.2361H23.2303H23.2244H23.2186H23.2127H23.2068H23.201H23.1951H23.1892H23.1834H23.1775H23.1716H23.1658H23.1599H23.154H23.1482H23.1423H23.1364H23.1306H23.1247H23.1188H23.1129H23.1071H23.1012H23.0953H23.0895H23.0836H23.0777H23.0718H23.066H23.0601H23.0542H23.0483H23.0425H23.0366H23.0307H23.0248H23.0189H23.0131H23.0072H23.0013H22.9954H22.9896H22.9837H22.9778H22.9719H22.966H22.9601H22.9543H22.9484H22.9425H22.9366H22.9307H22.9248H22.919H22.9131H22.9072H22.9013H22.8954H22.8895H22.8836H22.8777H22.8718H22.866H22.8601H22.8542H22.8483H22.8424H22.8365H22.8306H22.8247H22.8188H22.8129H22.807H22.8011H22.7952H22.7893H22.7834H22.7775H22.7716H22.7657H22.7598H22.7539H22.748H22.7421H22.7362H22.7303H22.7244H22.7185H22.7126H22.7067H22.7008H22.6949H22.689H22.6831H22.6772H22.6713H22.6654H22.6595H22.6536H22.6477H22.6417H22.6358H22.6299H22.624H22.6181H22.6122H22.6063H22.6004H22.5944H22.5885H22.5826H22.5767H22.5708H22.5649H22.5589H22.553H22.5471H22.5412H22.5353H22.5294H22.5234H22.5175H22.5116H22.5057H22.5V21.4972V21.4894V21.4817V21.474V21.4662V21.4585V21.4508V21.443V21.4353V21.4275V21.4198V21.4121V21.4043V21.3966V21.3888V21.3811V21.3734V21.3656V21.3579V21.3501V21.3424V21.3347V21.3269V21.3192V21.3114V21.3037V21.2959V21.2882V21.2805V21.2727V21.265V21.2572V21.2495V21.2418V21.234V21.2263V21.2185V21.2108V21.203V21.1953V21.1875V21.1798V21.1721V21.1643V21.1566V21.1488V21.1411V21.1333V21.1256V21.1178V21.1101V21.1023V21.0946V21.0869V21.0791V21.0714V21.0636V21.0559V21.0481V21.0404V21.0326V21.0249V21.0171V21.0094V21.0016V20.9939V20.9861V20.9784V20.9706V20.9629V20.9551V20.9474V20.9396V20.9319V20.9241V20.9164V20.9086V20.9009V20.8931V20.8854V20.8776V20.8699V20.8621V20.8543V20.8466V20.8388V20.8311V20.8233V20.8156V20.8078V20.8001V20.7923V20.7845V20.7768V20.769V20.7613V20.7535V20.7458V20.738V20.7302V20.7225V20.7147V20.707V20.6992V20.6915V20.6837V20.6759V20.6682V20.6604V20.6526V20.6449V20.6371V20.6294V20.6216V20.6138V20.6061V20.5983V20.5905V20.5828V20.575V20.5673V20.5595V20.5517V20.544V20.5362V20.5284V20.5207V20.5129V20.5051V20.4974V20.4896V20.4818V20.474V20.4663V20.4585V20.4507V20.443V20.4352V20.4274V20.4197V20.4119V20.4041V20.3963V20.3886V20.3808V20.373V20.3652V20.3575V20.3497V20.3419V20.3341V20.3264V20.3186V20.3108V20.303V20.2953V20.2875V20.2797V20.2719V20.2642V20.2564V20.2486V20.2408V20.233V20.2252V20.2175V20.2097V20.2019V20.1941V20.1863V20.1786V20.1708V20.163V20.1552V20.1474V20.1396V20.1318V20.1241V20.1163V20.1085V20.1007V20.0929V20.0851V20.0773V20.0695V20.0617V20.054V20.0462V20.0384V20.0306V20.0228V20.015V20.0072V19.9994V19.9916V19.9838V19.976V19.9682V19.9604V19.9526V19.9448V19.937V19.9292V19.9215V19.9137V19.9059V19.8981V19.8903V19.8825V19.8747V19.8668V19.859V19.8512V19.8434V19.8356V19.8278V19.82V19.8122V19.8044V19.7966V19.7888V19.781V19.7732V19.7654V19.7576V19.7498V19.742V19.7341V19.7263V19.7185V19.7107V19.7029V19.6951V19.6873V19.6795V19.6716V19.6638V19.656V19.6482V19.6404V19.6326V19.6247V19.6169V19.6091V19.6013V19.5935V19.5856V19.5778V19.57V19.5622V19.5544V19.5465V19.5387V19.5309V19.5231V19.5152V19.5074V19.4996V19.4918V19.4839V19.4761V19.4683V19.4604V19.4526V19.4448V19.4369V19.4291V19.4213V19.4134V19.4056V19.3978V19.3899V19.3821V19.3743V19.3664V19.3586V19.3508V19.3429V19.3351V19.3272V19.3194V19.3116V19.3037V19.2959V19.288V19.2802V19.2723V19.2645V19.2567V19.2488V19.241V19.2331V19.2253V19.2174V19.2096V19.2017V19.1939V19.186V19.1782V19.1703V19.1625V19.1546V19.1468V19.1389V19.131V19.1232V19.1153V19.1075V19.0996V19.0918V19.0839V19.076V19.0682V19.0603V19.0524V19.0446V19.0367V19.0289V19.021V19.0131V19.0053V18.9974V18.9895V18.9817V18.9738V18.9659V18.958V18.9502V18.9423V18.9344V18.9266V18.9187V18.9108V18.9029V18.8951V18.8872V18.8793V18.8714V18.8635V18.8557V18.8478V18.8399V18.832V18.8241V18.8163V18.8084V18.8005V18.7926V18.7847V18.7768V18.7689V18.761V18.7532V18.7453V18.7374V18.7295V18.7216V18.7137V18.7058V18.6979V18.69V18.6821V18.6742V18.6663V18.6584V18.6505V18.6426V18.6347V18.6268V18.6189V18.611V18.6031V18.5952V18.5873V18.5794V18.5715V18.5636V18.5557V18.5478V18.5399V18.5319V18.524V18.5161V18.5082V18.5003V18.5Z"
            fill={props.color}
            stroke={props.color}
          />
          <Path
            d="M18.5 18.5H18.5031H18.5069H18.5108H18.5147H18.5186H18.5224H18.5263H18.5302H18.5341H18.5379H18.5418H18.5457H18.5496H18.5534H18.5573H18.5612H18.5651H18.5689H18.5728H18.5767H18.5806H18.5845H18.5883H18.5922H18.5961H18.6H18.6038H18.6077H18.6116H18.6155H18.6194H18.6232H18.6271H18.631H18.6349H18.6388H18.6426H18.6465H18.6504H18.6543H18.6582H18.662H18.6659H18.6698H18.6737H18.6776H18.6814H18.6853H18.6892H18.6931H18.697H18.7008H18.7047H18.7086H18.7125H18.7164H18.7203H18.7241H18.728H18.7319H18.7358H18.7397H18.7436H18.7474H18.7513H18.7552H18.7591H18.763H18.7669H18.7707H18.7746H18.7785H18.7824H18.7863H18.7902H18.7941H18.7979H18.8018H18.8057H18.8096H18.8135H18.8174H18.8213H18.8252H18.829H18.8329H18.8368H18.8407H18.8446H18.8485H18.8524H18.8563H18.8601H18.864H18.8679H18.8718H18.8757H18.8796H18.8835H18.8874H18.8913H18.8952H18.899H18.9029H18.9068H18.9107H18.9146H18.9185H18.9224H18.9263H18.9302H18.9341H18.938H18.9419H18.9458H18.9497H18.9535H18.9574H18.9613H18.9652H18.9691H18.973H18.9769H18.9808H18.9847H18.9886H18.9925H18.9964H19.0003H19.0042H19.0081H19.012H19.0159H19.0198H19.0237H19.0276H19.0315H19.0354H19.0393H19.0432H19.0471H19.051H19.0549H19.0588H19.0627H19.0666H19.0705H19.0744H19.0783H19.0822H19.0861H19.09H19.0939H19.0978H19.1017H19.1056H19.1095H19.1134H19.1173H19.1212H19.1251H19.129H19.1329H19.1368H19.1407H19.1446H19.1486H19.1525H19.1564H19.1603H19.1642H19.1681H19.172H19.1759H19.1798H19.1837H19.1876H19.1915H19.1954H19.1994H19.2033H19.2072H19.2111H19.215H19.2189H19.2228H19.2267H19.2306H19.2346H19.2385H19.2424H19.2463H19.2502H19.2541H19.258H19.262H19.2659H19.2698H19.2737H19.2776H19.2815H19.2854H19.2894H19.2933H19.2972H19.3011H19.305H19.3089H19.3129H19.3168H19.3207H19.3246H19.3285H19.3325H19.3364H19.3403H19.3442H19.3481H19.3521H19.356H19.3599H19.3638H19.3677H19.3717H19.3756H19.3795H19.3834H19.3874H19.3913H19.3952H19.3991H19.4031H19.407H19.4109H19.4148H19.4188H19.4227H19.4266H19.4306H19.4345H19.4384H19.4423H19.4463H19.4502H19.4541H19.4581H19.462H19.4659H19.4698H19.4738H19.4777H19.4816H19.4856H19.4895H19.4934H19.4974H19.5V18.5028V18.5106V18.5183V18.526V18.5338V18.5415V18.5492V18.557V18.5647V18.5725V18.5802V18.5879V18.5957V18.6034V18.6112V18.6189V18.6266V18.6344V18.6421V18.6499V18.6576V18.6653V18.6731V18.6808V18.6886V18.6963V18.7041V18.7118V18.7195V18.7273V18.735V18.7428V18.7505V18.7582V18.766V18.7737V18.7815V18.7892V18.797V18.8047V18.8125V18.8202V18.8279V18.8357V18.8434V18.8512V18.8589V18.8667V18.8744V18.8822V18.8899V18.8977V18.9054V18.9131V18.9209V18.9286V18.9364V18.9441V18.9519V18.9596V18.9674V18.9751V18.9829V18.9906V18.9984V19.0061V19.0139V19.0216V19.0294V19.0371V19.0449V19.0526V19.0604V19.0681V19.0759V19.0836V19.0914V19.0991V19.1069V19.1146V19.1224V19.1301V19.1379V19.1457V19.1534V19.1612V19.1689V19.1767V19.1844V19.1922V19.1999V19.2077V19.2155V19.2232V19.231V19.2387V19.2465V19.2542V19.262V19.2698V19.2775V19.2853V19.293V19.3008V19.3085V19.3163V19.3241V19.3318V19.3396V19.3474V19.3551V19.3629V19.3706V19.3784V19.3862V19.3939V19.4017V19.4095V19.4172V19.425V19.4327V19.4405V19.4483V19.456V19.4638V19.4716V19.4793V19.4871V19.4949V19.5026V19.5104V19.5182V19.526V19.5337V19.5415V19.5493V19.557V19.5648V19.5726V19.5803V19.5881V19.5959V19.6037V19.6114V19.6192V19.627V19.6348V19.6425V19.6503V19.6581V19.6659V19.6736V19.6814V19.6892V19.697V19.7047V19.7125V19.7203V19.7281V19.7358V19.7436V19.7514V19.7592V19.767V19.7748V19.7825V19.7903V19.7981V19.8059V19.8137V19.8214V19.8292V19.837V19.8448V19.8526V19.8604V19.8682V19.8759V19.8837V19.8915V19.8993V19.9071V19.9149V19.9227V19.9305V19.9383V19.946V19.9538V19.9616V19.9694V19.9772V19.985V19.9928V20.0006V20.0084V20.0162V20.024V20.0318V20.0396V20.0474V20.0552V20.063V20.0708V20.0785V20.0863V20.0941V20.1019V20.1097V20.1175V20.1253V20.1332V20.141V20.1488V20.1566V20.1644V20.1722V20.18V20.1878V20.1956V20.2034V20.2112V20.219V20.2268V20.2346V20.2424V20.2502V20.258V20.2659V20.2737V20.2815V20.2893V20.2971V20.3049V20.3127V20.3205V20.3284V20.3362V20.344V20.3518V20.3596V20.3674V20.3753V20.3831V20.3909V20.3987V20.4065V20.4144V20.4222V20.43V20.4378V20.4456V20.4535V20.4613V20.4691V20.4769V20.4848V20.4926V20.5004V20.5082V20.5161V20.5239V20.5317V20.5396V20.5474V20.5552V20.5631V20.5709V20.5787V20.5866V20.5944V20.6022V20.6101V20.6179V20.6257V20.6336V20.6414V20.6492V20.6571V20.6649V20.6728V20.6806V20.6884V20.6963V20.7041V20.712V20.7198V20.7277V20.7355V20.7433V20.7512V20.759V20.7669V20.7747V20.7826V20.7904V20.7983V20.8061V20.814V20.8218V20.8297V20.8375V20.8454V20.8532V20.8611V20.869V20.8768V20.8847V20.8925V20.9004V20.9082V20.9161V20.924V20.9318V20.9397V20.9476V20.9554V20.9633V20.9711V20.979V20.9869V20.9947V21.0026V21.0105V21.0183V21.0262V21.0341V21.042V21.0498V21.0577V21.0656V21.0734V21.0813V21.0892V21.0971V21.1049V21.1128V21.1207V21.1286V21.1365V21.1443V21.1522V21.1601V21.168V21.1759V21.1837V21.1916V21.1995V21.2074V21.2153V21.2232V21.2311V21.239V21.2468V21.2547V21.2626V21.2705V21.2784V21.2863V21.2942V21.3021V21.31V21.3179V21.3258V21.3337V21.3416V21.3495V21.3574V21.3653V21.3732V21.3811V21.389V21.3969V21.4048V21.4127V21.4206V21.4285V21.4364V21.4443V21.4522V21.4601V21.4681V21.476V21.4839V21.4918V21.4997V21.5H19.4969H19.4931H19.4892H19.4853H19.4814H19.4776H19.4737H19.4698H19.4659H19.4621H19.4582H19.4543H19.4504H19.4466H19.4427H19.4388H19.4349H19.4311H19.4272H19.4233H19.4194H19.4155H19.4117H19.4078H19.4039H19.4H19.3962H19.3923H19.3884H19.3845H19.3806H19.3768H19.3729H19.369H19.3651H19.3612H19.3574H19.3535H19.3496H19.3457H19.3418H19.338H19.3341H19.3302H19.3263H19.3224H19.3186H19.3147H19.3108H19.3069H19.303H19.2992H19.2953H19.2914H19.2875H19.2836H19.2797H19.2759H19.272H19.2681H19.2642H19.2603H19.2564H19.2526H19.2487H19.2448H19.2409H19.237H19.2331H19.2293H19.2254H19.2215H19.2176H19.2137H19.2098H19.2059H19.2021H19.1982H19.1943H19.1904H19.1865H19.1826H19.1787H19.1748H19.171H19.1671H19.1632H19.1593H19.1554H19.1515H19.1476H19.1437H19.1399H19.136H19.1321H19.1282H19.1243H19.1204H19.1165H19.1126H19.1087H19.1048H19.101H19.0971H19.0932H19.0893H19.0854H19.0815H19.0776H19.0737H19.0698H19.0659H19.062H19.0581H19.0542H19.0503H19.0465H19.0426H19.0387H19.0348H19.0309H19.027H19.0231H19.0192H19.0153H19.0114H19.0075H19.0036H18.9997H18.9958H18.9919H18.988H18.9841H18.9802H18.9763H18.9724H18.9685H18.9646H18.9607H18.9568H18.9529H18.949H18.9451H18.9412H18.9373H18.9334H18.9295H18.9256H18.9217H18.9178H18.9139H18.91H18.9061H18.9022H18.8983H18.8944H18.8905H18.8866H18.8827H18.8788H18.8749H18.871H18.8671H18.8632H18.8593H18.8554H18.8514H18.8475H18.8436H18.8397H18.8358H18.8319H18.828H18.8241H18.8202H18.8163H18.8124H18.8085H18.8046H18.8006H18.7967H18.7928H18.7889H18.785H18.7811H18.7772H18.7733H18.7694H18.7654H18.7615H18.7576H18.7537H18.7498H18.7459H18.742H18.738H18.7341H18.7302H18.7263H18.7224H18.7185H18.7146H18.7106H18.7067H18.7028H18.6989H18.695H18.6911H18.6871H18.6832H18.6793H18.6754H18.6715H18.6675H18.6636H18.6597H18.6558H18.6519H18.6479H18.644H18.6401H18.6362H18.6323H18.6283H18.6244H18.6205H18.6166H18.6126H18.6087H18.6048H18.6009H18.5969H18.593H18.5891H18.5852H18.5812H18.5773H18.5734H18.5694H18.5655H18.5616H18.5577H18.5537H18.5498H18.5459H18.5419H18.538H18.5341H18.5302H18.5262H18.5223H18.5184H18.5144H18.5105H18.5066H18.5026H18.5V21.4972V21.4894V21.4817V21.474V21.4662V21.4585V21.4508V21.443V21.4353V21.4275V21.4198V21.4121V21.4043V21.3966V21.3888V21.3811V21.3734V21.3656V21.3579V21.3501V21.3424V21.3347V21.3269V21.3192V21.3114V21.3037V21.2959V21.2882V21.2805V21.2727V21.265V21.2572V21.2495V21.2418V21.234V21.2263V21.2185V21.2108V21.203V21.1953V21.1875V21.1798V21.1721V21.1643V21.1566V21.1488V21.1411V21.1333V21.1256V21.1178V21.1101V21.1023V21.0946V21.0869V21.0791V21.0714V21.0636V21.0559V21.0481V21.0404V21.0326V21.0249V21.0171V21.0094V21.0016V20.9939V20.9861V20.9784V20.9706V20.9629V20.9551V20.9474V20.9396V20.9319V20.9241V20.9164V20.9086V20.9009V20.8931V20.8854V20.8776V20.8699V20.8621V20.8543V20.8466V20.8388V20.8311V20.8233V20.8156V20.8078V20.8001V20.7923V20.7845V20.7768V20.769V20.7613V20.7535V20.7458V20.738V20.7302V20.7225V20.7147V20.707V20.6992V20.6915V20.6837V20.6759V20.6682V20.6604V20.6526V20.6449V20.6371V20.6294V20.6216V20.6138V20.6061V20.5983V20.5905V20.5828V20.575V20.5673V20.5595V20.5517V20.544V20.5362V20.5284V20.5207V20.5129V20.5051V20.4974V20.4896V20.4818V20.474V20.4663V20.4585V20.4507V20.443V20.4352V20.4274V20.4197V20.4119V20.4041V20.3963V20.3886V20.3808V20.373V20.3652V20.3575V20.3497V20.3419V20.3341V20.3264V20.3186V20.3108V20.303V20.2953V20.2875V20.2797V20.2719V20.2642V20.2564V20.2486V20.2408V20.233V20.2252V20.2175V20.2097V20.2019V20.1941V20.1863V20.1786V20.1708V20.163V20.1552V20.1474V20.1396V20.1318V20.1241V20.1163V20.1085V20.1007V20.0929V20.0851V20.0773V20.0695V20.0617V20.054V20.0462V20.0384V20.0306V20.0228V20.015V20.0072V19.9994V19.9916V19.9838V19.976V19.9682V19.9604V19.9526V19.9448V19.937V19.9292V19.9215V19.9137V19.9059V19.8981V19.8903V19.8825V19.8747V19.8668V19.859V19.8512V19.8434V19.8356V19.8278V19.82V19.8122V19.8044V19.7966V19.7888V19.781V19.7732V19.7654V19.7576V19.7498V19.742V19.7341V19.7263V19.7185V19.7107V19.7029V19.6951V19.6873V19.6795V19.6716V19.6638V19.656V19.6482V19.6404V19.6326V19.6247V19.6169V19.6091V19.6013V19.5935V19.5856V19.5778V19.57V19.5622V19.5544V19.5465V19.5387V19.5309V19.5231V19.5152V19.5074V19.4996V19.4918V19.4839V19.4761V19.4683V19.4604V19.4526V19.4448V19.4369V19.4291V19.4213V19.4134V19.4056V19.3978V19.3899V19.3821V19.3743V19.3664V19.3586V19.3508V19.3429V19.3351V19.3272V19.3194V19.3116V19.3037V19.2959V19.288V19.2802V19.2723V19.2645V19.2567V19.2488V19.241V19.2331V19.2253V19.2174V19.2096V19.2017V19.1939V19.186V19.1782V19.1703V19.1625V19.1546V19.1468V19.1389V19.131V19.1232V19.1153V19.1075V19.0996V19.0918V19.0839V19.076V19.0682V19.0603V19.0524V19.0446V19.0367V19.0289V19.021V19.0131V19.0053V18.9974V18.9895V18.9817V18.9738V18.9659V18.958V18.9502V18.9423V18.9344V18.9266V18.9187V18.9108V18.9029V18.8951V18.8872V18.8793V18.8714V18.8635V18.8557V18.8478V18.8399V18.832V18.8241V18.8163V18.8084V18.8005V18.7926V18.7847V18.7768V18.7689V18.761V18.7532V18.7453V18.7374V18.7295V18.7216V18.7137V18.7058V18.6979V18.69V18.6821V18.6742V18.6663V18.6584V18.6505V18.6426V18.6347V18.6268V18.6189V18.611V18.6031V18.5952V18.5873V18.5794V18.5715V18.5636V18.5557V18.5478V18.5399V18.5319V18.524V18.5161V18.5082V18.5003V18.5Z"
            fill="black"
            stroke={props.color}
          />
          <Path
            d="M15.5 20.5H15.5028H15.5106H15.5183H15.526H15.5338H15.5415H15.5492H15.557H15.5647H15.5725H15.5802H15.5879H15.5957H15.6034H15.6112H15.6189H15.6266H15.6344H15.6421H15.6499H15.6576H15.6653H15.6731H15.6808H15.6886H15.6963H15.7041H15.7118H15.7195H15.7273H15.735H15.7428H15.7505H15.7582H15.766H15.7737H15.7815H15.7892H15.797H15.8047H15.8125H15.8202H15.8279H15.8357H15.8434H15.8512H15.8589H15.8667H15.8744H15.8822H15.8899H15.8977H15.9054H15.9131H15.9209H15.9286H15.9364H15.9441H15.9519H15.9596H15.9674H15.9751H15.9829H15.9906H15.9984H16.0061H16.0139H16.0216H16.0294H16.0371H16.0449H16.0526H16.0604H16.0681H16.0759H16.0836H16.0914H16.0991H16.1069H16.1146H16.1224H16.1301H16.1379H16.1457H16.1534H16.1612H16.1689H16.1767H16.1844H16.1922H16.1999H16.2077H16.2155H16.2232H16.231H16.2387H16.2465H16.2542H16.262H16.2698H16.2775H16.2853H16.293H16.3008H16.3085H16.3163H16.3241H16.3318H16.3396H16.3474H16.3551H16.3629H16.3706H16.3784H16.3862H16.3939H16.4017H16.4095H16.4172H16.425H16.4327H16.4405H16.4483H16.456H16.4638H16.4716H16.4793H16.4871H16.4949H16.5026H16.5104H16.5182H16.526H16.5337H16.5415H16.5493H16.557H16.5648H16.5726H16.5803H16.5881H16.5959H16.6037H16.6114H16.6192H16.627H16.6348H16.6425H16.6503H16.6581H16.6659H16.6736H16.6814H16.6892H16.697H16.7047H16.7125H16.7203H16.7281H16.7358H16.7436H16.7514H16.7592H16.767H16.7748H16.7825H16.7903H16.7981H16.8059H16.8137H16.8214H16.8292H16.837H16.8448H16.8526H16.8604H16.8682H16.8759H16.8837H16.8915H16.8993H16.9071H16.9149H16.9227H16.9305H16.9383H16.946H16.9538H16.9616H16.9694H16.9772H16.985H16.9928H17.0006H17.0084H17.0162H17.024H17.0318H17.0396H17.0474H17.0552H17.063H17.0708H17.0785H17.0863H17.0941H17.1019H17.1097H17.1175H17.1253H17.1332H17.141H17.1488H17.1566H17.1644H17.1722H17.18H17.1878H17.1956H17.2034H17.2112H17.219H17.2268H17.2346H17.2424H17.2502H17.258H17.2659H17.2737H17.2815H17.2893H17.2971H17.3049H17.3127H17.3205H17.3284H17.3362H17.344H17.3518H17.3596H17.3674H17.3753H17.3831H17.3909H17.3987H17.4065H17.4144H17.4222H17.43H17.4378H17.4456H17.4535H17.4613H17.4691H17.4769H17.4848H17.4926H17.5004H17.5082H17.5161H17.5239H17.5317H17.5396H17.5474H17.5552H17.5631H17.5709H17.5787H17.5866H17.5944H17.6022H17.6101H17.6179H17.6257H17.6336H17.6414H17.6492H17.6571H17.6649H17.6728H17.6806H17.6884H17.6963H17.7041H17.712H17.7198H17.7277H17.7355H17.7433H17.7512H17.759H17.7669H17.7747H17.7826H17.7904H17.7983H17.8061H17.814H17.8218H17.8297H17.8375H17.8454H17.8532H17.8611H17.869H17.8768H17.8847H17.8925H17.9004H17.9082H17.9161H17.924H17.9318H17.9397H17.9476H17.9554H17.9633H17.9711H17.979H17.9869H17.9947H18.0026H18.0105H18.0183H18.0262H18.0341H18.042H18.0498H18.0577H18.0656H18.0734H18.0813H18.0892H18.0971H18.1049H18.1128H18.1207H18.1286H18.1365H18.1443H18.1522H18.1601H18.168H18.1759H18.1837H18.1916H18.1995H18.2074H18.2153H18.2232H18.2311H18.239H18.2468H18.2547H18.2626H18.2705H18.2784H18.2863H18.2942H18.3021H18.31H18.3179H18.3258H18.3337H18.3416H18.3495H18.3574H18.3653H18.3732H18.3811H18.389H18.3969H18.4048H18.4127H18.4206H18.4285H18.4364H18.4443H18.4522H18.4601H18.4681H18.476H18.4839H18.4918H18.4997H18.5V20.5031V20.5069V20.5108V20.5147V20.5186V20.5224V20.5263V20.5302V20.5341V20.5379V20.5418V20.5457V20.5496V20.5534V20.5573V20.5612V20.5651V20.5689V20.5728V20.5767V20.5806V20.5845V20.5883V20.5922V20.5961V20.6V20.6038V20.6077V20.6116V20.6155V20.6194V20.6232V20.6271V20.631V20.6349V20.6388V20.6426V20.6465V20.6504V20.6543V20.6582V20.662V20.6659V20.6698V20.6737V20.6776V20.6814V20.6853V20.6892V20.6931V20.697V20.7008V20.7047V20.7086V20.7125V20.7164V20.7203V20.7241V20.728V20.7319V20.7358V20.7397V20.7436V20.7474V20.7513V20.7552V20.7591V20.763V20.7669V20.7707V20.7746V20.7785V20.7824V20.7863V20.7902V20.7941V20.7979V20.8018V20.8057V20.8096V20.8135V20.8174V20.8213V20.8252V20.829V20.8329V20.8368V20.8407V20.8446V20.8485V20.8524V20.8563V20.8601V20.864V20.8679V20.8718V20.8757V20.8796V20.8835V20.8874V20.8913V20.8952V20.899V20.9029V20.9068V20.9107V20.9146V20.9185V20.9224V20.9263V20.9302V20.9341V20.938V20.9419V20.9458V20.9497V20.9535V20.9574V20.9613V20.9652V20.9691V20.973V20.9769V20.9808V20.9847V20.9886V20.9925V20.9964V21.0003V21.0042V21.0081V21.012V21.0159V21.0198V21.0237V21.0276V21.0315V21.0354V21.0393V21.0432V21.0471V21.051V21.0549V21.0588V21.0627V21.0666V21.0705V21.0744V21.0783V21.0822V21.0861V21.09V21.0939V21.0978V21.1017V21.1056V21.1095V21.1134V21.1173V21.1212V21.1251V21.129V21.1329V21.1368V21.1407V21.1446V21.1486V21.1525V21.1564V21.1603V21.1642V21.1681V21.172V21.1759V21.1798V21.1837V21.1876V21.1915V21.1954V21.1994V21.2033V21.2072V21.2111V21.215V21.2189V21.2228V21.2267V21.2306V21.2346V21.2385V21.2424V21.2463V21.2502V21.2541V21.258V21.262V21.2659V21.2698V21.2737V21.2776V21.2815V21.2854V21.2894V21.2933V21.2972V21.3011V21.305V21.3089V21.3129V21.3168V21.3207V21.3246V21.3285V21.3325V21.3364V21.3403V21.3442V21.3481V21.3521V21.356V21.3599V21.3638V21.3677V21.3717V21.3756V21.3795V21.3834V21.3874V21.3913V21.3952V21.3991V21.4031V21.407V21.4109V21.4148V21.4188V21.4227V21.4266V21.4306V21.4345V21.4384V21.4423V21.4463V21.4502V21.4541V21.4581V21.462V21.4659V21.4698V21.4738V21.4777V21.4816V21.4856V21.4895V21.4934V21.4974V21.5H18.4972H18.4894H18.4817H18.474H18.4662H18.4585H18.4508H18.443H18.4353H18.4275H18.4198H18.4121H18.4043H18.3966H18.3888H18.3811H18.3734H18.3656H18.3579H18.3501H18.3424H18.3347H18.3269H18.3192H18.3114H18.3037H18.2959H18.2882H18.2805H18.2727H18.265H18.2572H18.2495H18.2418H18.234H18.2263H18.2185H18.2108H18.203H18.1953H18.1875H18.1798H18.1721H18.1643H18.1566H18.1488H18.1411H18.1333H18.1256H18.1178H18.1101H18.1023H18.0946H18.0869H18.0791H18.0714H18.0636H18.0559H18.0481H18.0404H18.0326H18.0249H18.0171H18.0094H18.0016H17.9939H17.9861H17.9784H17.9706H17.9629H17.9551H17.9474H17.9396H17.9319H17.9241H17.9164H17.9086H17.9009H17.8931H17.8854H17.8776H17.8699H17.8621H17.8543H17.8466H17.8388H17.8311H17.8233H17.8156H17.8078H17.8001H17.7923H17.7845H17.7768H17.769H17.7613H17.7535H17.7458H17.738H17.7302H17.7225H17.7147H17.707H17.6992H17.6915H17.6837H17.6759H17.6682H17.6604H17.6526H17.6449H17.6371H17.6294H17.6216H17.6138H17.6061H17.5983H17.5905H17.5828H17.575H17.5673H17.5595H17.5517H17.544H17.5362H17.5284H17.5207H17.5129H17.5051H17.4974H17.4896H17.4818H17.474H17.4663H17.4585H17.4507H17.443H17.4352H17.4274H17.4197H17.4119H17.4041H17.3963H17.3886H17.3808H17.373H17.3652H17.3575H17.3497H17.3419H17.3341H17.3264H17.3186H17.3108H17.303H17.2953H17.2875H17.2797H17.2719H17.2642H17.2564H17.2486H17.2408H17.233H17.2252H17.2175H17.2097H17.2019H17.1941H17.1863H17.1786H17.1708H17.163H17.1552H17.1474H17.1396H17.1318H17.1241H17.1163H17.1085H17.1007H17.0929H17.0851H17.0773H17.0695H17.0617H17.054H17.0462H17.0384H17.0306H17.0228H17.015H17.0072H16.9994H16.9916H16.9838H16.976H16.9682H16.9604H16.9526H16.9448H16.937H16.9292H16.9215H16.9137H16.9059H16.8981H16.8903H16.8825H16.8747H16.8668H16.859H16.8512H16.8434H16.8356H16.8278H16.82H16.8122H16.8044H16.7966H16.7888H16.781H16.7732H16.7654H16.7576H16.7498H16.742H16.7341H16.7263H16.7185H16.7107H16.7029H16.6951H16.6873H16.6795H16.6716H16.6638H16.656H16.6482H16.6404H16.6326H16.6247H16.6169H16.6091H16.6013H16.5935H16.5856H16.5778H16.57H16.5622H16.5544H16.5465H16.5387H16.5309H16.5231H16.5152H16.5074H16.4996H16.4918H16.4839H16.4761H16.4683H16.4604H16.4526H16.4448H16.4369H16.4291H16.4213H16.4134H16.4056H16.3978H16.3899H16.3821H16.3743H16.3664H16.3586H16.3508H16.3429H16.3351H16.3272H16.3194H16.3116H16.3037H16.2959H16.288H16.2802H16.2723H16.2645H16.2567H16.2488H16.241H16.2331H16.2253H16.2174H16.2096H16.2017H16.1939H16.186H16.1782H16.1703H16.1625H16.1546H16.1468H16.1389H16.131H16.1232H16.1153H16.1075H16.0996H16.0918H16.0839H16.076H16.0682H16.0603H16.0524H16.0446H16.0367H16.0289H16.021H16.0131H16.0053H15.9974H15.9895H15.9817H15.9738H15.9659H15.958H15.9502H15.9423H15.9344H15.9266H15.9187H15.9108H15.9029H15.8951H15.8872H15.8793H15.8714H15.8635H15.8557H15.8478H15.8399H15.832H15.8241H15.8163H15.8084H15.8005H15.7926H15.7847H15.7768H15.7689H15.761H15.7532H15.7453H15.7374H15.7295H15.7216H15.7137H15.7058H15.6979H15.69H15.6821H15.6742H15.6663H15.6584H15.6505H15.6426H15.6347H15.6268H15.6189H15.611H15.6031H15.5952H15.5873H15.5794H15.5715H15.5636H15.5557H15.5478H15.5399H15.5319H15.524H15.5161H15.5082H15.5003H15.5V21.4969V21.4931V21.4892V21.4853V21.4814V21.4776V21.4737V21.4698V21.4659V21.4621V21.4582V21.4543V21.4504V21.4466V21.4427V21.4388V21.4349V21.4311V21.4272V21.4233V21.4194V21.4155V21.4117V21.4078V21.4039V21.4V21.3962V21.3923V21.3884V21.3845V21.3806V21.3768V21.3729V21.369V21.3651V21.3612V21.3574V21.3535V21.3496V21.3457V21.3418V21.338V21.3341V21.3302V21.3263V21.3224V21.3186V21.3147V21.3108V21.3069V21.303V21.2992V21.2953V21.2914V21.2875V21.2836V21.2797V21.2759V21.272V21.2681V21.2642V21.2603V21.2564V21.2526V21.2487V21.2448V21.2409V21.237V21.2331V21.2293V21.2254V21.2215V21.2176V21.2137V21.2098V21.2059V21.2021V21.1982V21.1943V21.1904V21.1865V21.1826V21.1787V21.1748V21.171V21.1671V21.1632V21.1593V21.1554V21.1515V21.1476V21.1437V21.1399V21.136V21.1321V21.1282V21.1243V21.1204V21.1165V21.1126V21.1087V21.1048V21.101V21.0971V21.0932V21.0893V21.0854V21.0815V21.0776V21.0737V21.0698V21.0659V21.062V21.0581V21.0542V21.0503V21.0465V21.0426V21.0387V21.0348V21.0309V21.027V21.0231V21.0192V21.0153V21.0114V21.0075V21.0036V20.9997V20.9958V20.9919V20.988V20.9841V20.9802V20.9763V20.9724V20.9685V20.9646V20.9607V20.9568V20.9529V20.949V20.9451V20.9412V20.9373V20.9334V20.9295V20.9256V20.9217V20.9178V20.9139V20.91V20.9061V20.9022V20.8983V20.8944V20.8905V20.8866V20.8827V20.8788V20.8749V20.871V20.8671V20.8632V20.8593V20.8554V20.8514V20.8475V20.8436V20.8397V20.8358V20.8319V20.828V20.8241V20.8202V20.8163V20.8124V20.8085V20.8046V20.8006V20.7967V20.7928V20.7889V20.785V20.7811V20.7772V20.7733V20.7694V20.7654V20.7615V20.7576V20.7537V20.7498V20.7459V20.742V20.738V20.7341V20.7302V20.7263V20.7224V20.7185V20.7146V20.7106V20.7067V20.7028V20.6989V20.695V20.6911V20.6871V20.6832V20.6793V20.6754V20.6715V20.6675V20.6636V20.6597V20.6558V20.6519V20.6479V20.644V20.6401V20.6362V20.6323V20.6283V20.6244V20.6205V20.6166V20.6126V20.6087V20.6048V20.6009V20.5969V20.593V20.5891V20.5852V20.5812V20.5773V20.5734V20.5694V20.5655V20.5616V20.5577V20.5537V20.5498V20.5459V20.5419V20.538V20.5341V20.5302V20.5262V20.5223V20.5184V20.5144V20.5105V20.5066V20.5026V20.5Z"
            fill="black"
            stroke={props.color}
          />
          <Path
            d="M16.5335 21.5142L16.5334 21.5171L16.5333 21.5248L16.5333 21.5325L16.5332 21.5403L16.5331 21.548L16.5331 21.5557L16.533 21.5635L16.5329 21.5712L16.5328 21.579L16.5328 21.5867L16.5327 21.5944L16.5326 21.6022L16.5325 21.6099L16.5325 21.6177L16.5324 21.6254L16.5323 21.6331L16.5322 21.6409L16.5322 21.6486L16.5321 21.6564L16.532 21.6641L16.5319 21.6718L16.5319 21.6796L16.5318 21.6873L16.5317 21.6951L16.5316 21.7028L16.5316 21.7105L16.5315 21.7183L16.5314 21.726L16.5314 21.7338L16.5313 21.7415L16.5312 21.7492L16.5311 21.757L16.5311 21.7647L16.531 21.7725L16.5309 21.7802L16.5308 21.788L16.5308 21.7957L16.5307 21.8034L16.5306 21.8112L16.5305 21.8189L16.5305 21.8267L16.5304 21.8344L16.5303 21.8422L16.5302 21.8499L16.5302 21.8577L16.5301 21.8654L16.53 21.8731L16.5299 21.8809L16.5299 21.8886L16.5298 21.8964L16.5297 21.9041L16.5296 21.9119L16.5296 21.9196L16.5295 21.9274L16.5294 21.9351L16.5294 21.9429L16.5293 21.9506L16.5292 21.9584L16.5291 21.9661L16.5291 21.9738L16.529 21.9816L16.5289 21.9893L16.5288 21.9971L16.5288 22.0048L16.5287 22.0126L16.5286 22.0203L16.5285 22.0281L16.5285 22.0358L16.5284 22.0436L16.5283 22.0513L16.5282 22.0591L16.5282 22.0668L16.5281 22.0746L16.528 22.0823L16.5279 22.0901L16.5279 22.0978L16.5278 22.1056L16.5277 22.1133L16.5276 22.1211L16.5276 22.1289L16.5275 22.1366L16.5274 22.1444L16.5274 22.1521L16.5273 22.1599L16.5272 22.1676L16.5271 22.1754L16.5271 22.1831L16.527 22.1909L16.5269 22.1986L16.5268 22.2064L16.5268 22.2141L16.5267 22.2219L16.5266 22.2297L16.5265 22.2374L16.5265 22.2452L16.5264 22.2529L16.5263 22.2607L16.5262 22.2684L16.5262 22.2762L16.5261 22.284L16.526 22.2917L16.5259 22.2995L16.5259 22.3072L16.5258 22.315L16.5257 22.3228L16.5256 22.3305L16.5256 22.3383L16.5255 22.346L16.5254 22.3538L16.5253 22.3616L16.5253 22.3693L16.5252 22.3771L16.5251 22.3848L16.5251 22.3926L16.525 22.4004L16.5249 22.4081L16.5248 22.4159L16.5248 22.4237L16.5247 22.4314L16.5246 22.4392L16.5245 22.4469L16.5245 22.4547L16.5244 22.4625L16.5243 22.4702L16.5242 22.478L16.5242 22.4858L16.5241 22.4935L16.524 22.5013L16.5239 22.5091L16.5239 22.5168L16.5238 22.5246L16.5237 22.5324L16.5236 22.5401L16.5236 22.5479L16.5235 22.5557L16.5234 22.5635L16.5233 22.5712L16.5233 22.579L16.5232 22.5868L16.5231 22.5945L16.523 22.6023L16.523 22.6101L16.5229 22.6178L16.5228 22.6256L16.5227 22.6334L16.5227 22.6412L16.5226 22.6489L16.5225 22.6567L16.5225 22.6645L16.5224 22.6723L16.5223 22.68L16.5222 22.6878L16.5222 22.6956L16.5221 22.7034L16.522 22.7111L16.5219 22.7189L16.5219 22.7267L16.5218 22.7345L16.5217 22.7423L16.5216 22.75L16.5216 22.7578L16.5215 22.7656L16.5214 22.7734L16.5213 22.7812L16.5213 22.7889L16.5212 22.7967L16.5211 22.8045L16.521 22.8123L16.521 22.8201L16.5209 22.8278L16.5208 22.8356L16.5207 22.8434L16.5207 22.8512L16.5206 22.859L16.5205 22.8668L16.5204 22.8745L16.5204 22.8823L16.5203 22.8901L16.5202 22.8979L16.5201 22.9057L16.5201 22.9135L16.52 22.9213L16.5199 22.9291L16.5198 22.9368L16.5198 22.9446L16.5197 22.9524L16.5196 22.9602L16.5195 22.968L16.5195 22.9758L16.5194 22.9836L16.5193 22.9914L16.5193 22.9992L16.5192 23.007L16.5191 23.0148L16.519 23.0226L16.519 23.0303L16.5189 23.0381L16.5188 23.0459L16.5187 23.0537L16.5187 23.0615L16.5186 23.0693L16.5185 23.0771L16.5184 23.0849L16.5184 23.0927L16.5183 23.1005L16.5182 23.1083L16.5181 23.1161L16.5181 23.1239L16.518 23.1317L16.5179 23.1395L16.5178 23.1473L16.5178 23.1551L16.5177 23.1629L16.5176 23.1707L16.5175 23.1785L16.5175 23.1863L16.5174 23.1941L16.5173 23.2019L16.5172 23.2097L16.5172 23.2176L16.5171 23.2254L16.517 23.2332L16.5169 23.241L16.5169 23.2488L16.5168 23.2566L16.5167 23.2644L16.5166 23.2722L16.5166 23.28L16.5165 23.2878L16.5164 23.2956L16.5163 23.3034L16.5163 23.3113L16.5162 23.3191L16.5161 23.3269L16.516 23.3347L16.516 23.3425L16.5159 23.3503L16.5158 23.3581L16.5157 23.366L16.5157 23.3738L16.5156 23.3816L16.5155 23.3894L16.5154 23.3972L16.5154 23.405L16.5153 23.4129L16.5152 23.4207L16.5151 23.4285L16.5151 23.4363L16.515 23.4441L16.5149 23.452L16.5148 23.4598L16.5148 23.4676L16.5147 23.4754L16.5146 23.4833L16.5145 23.4911L16.5145 23.4989L16.5144 23.5067L16.5143 23.5146L16.5142 23.5224L16.5142 23.5302L16.5141 23.538L16.514 23.5459L16.5139 23.5537L16.5139 23.5615L16.5138 23.5694L16.5137 23.5772L16.5136 23.585L16.5136 23.5929L16.5135 23.6007L16.5134 23.6085L16.5133 23.6164L16.5133 23.6242L16.5132 23.632L16.5131 23.6399L16.513 23.6477L16.513 23.6555L16.5129 23.6634L16.5128 23.6712L16.5127 23.6791L16.5127 23.6869L16.5126 23.6947L16.5125 23.7026L16.5125 23.7104L16.5124 23.7183L16.5123 23.7261L16.5122 23.7339L16.5122 23.7418L16.5121 23.7496L16.512 23.7575L16.5119 23.7653L16.5118 23.7732L16.5118 23.781L16.5117 23.7889L16.5116 23.7967L16.5115 23.8046L16.5115 23.8124L16.5114 23.8203L16.5113 23.8281L16.5112 23.836L16.5112 23.8438L16.5111 23.8517L16.511 23.8595L16.5109 23.8674L16.5109 23.8752L16.5108 23.8831L16.5107 23.8909L16.5106 23.8988L16.5106 23.9067L16.5105 23.9145L16.5104 23.9224L16.5103 23.9302L16.5103 23.9381L16.5102 23.946L16.5101 23.9538L16.51 23.9617L16.51 23.9695L16.5099 23.9774L16.5098 23.9853L16.5097 23.9931L16.5097 24.001L16.5096 24.0089L16.5095 24.0167L16.5094 24.0246L16.5094 24.0325L16.5093 24.0403L16.5092 24.0482L16.5091 24.0561L16.5091 24.0639L16.509 24.0718L16.5089 24.0797L16.5088 24.0876L16.5088 24.0954L16.5087 24.1033L16.5086 24.1112L16.5085 24.1191L16.5085 24.1269L16.5084 24.1348L16.5083 24.1427L16.5082 24.1506L16.5082 24.1585L16.5081 24.1663L16.508 24.1742L16.5079 24.1821L16.5079 24.19L16.5078 24.1979L16.5077 24.2058L16.5076 24.2136L16.5076 24.2215L16.5075 24.2294L16.5074 24.2373L16.5073 24.2452L16.5073 24.2531L16.5072 24.261L16.5071 24.2688L16.507 24.2767L16.507 24.2846L16.5069 24.2925L16.5068 24.3004L16.5067 24.3083L16.5067 24.3162L16.5066 24.3241L16.5065 24.332L16.5064 24.3399L16.5064 24.3478L16.5063 24.3557L16.5062 24.3636L16.5061 24.3715L16.5061 24.3794L16.506 24.3873L16.5059 24.3952L16.5058 24.4031L16.5058 24.411L16.5057 24.4189L16.5056 24.4268L16.5055 24.4347L16.5054 24.4426L16.5054 24.4505L16.5053 24.4584L16.5052 24.4663L16.5051 24.4743L16.5051 24.4822L16.505 24.4901L16.5049 24.498L16.5048 24.5059L16.5048 24.5138L16.5048 24.5141L16.5017 24.5141L16.4978 24.514L16.494 24.514L16.4901 24.514L16.4862 24.5139L16.4823 24.5139L16.4785 24.5139L16.4746 24.5138L16.4707 24.5138L16.4668 24.5137L16.463 24.5137L16.4591 24.5137L16.4552 24.5136L16.4513 24.5136L16.4474 24.5136L16.4436 24.5135L16.4397 24.5135L16.4358 24.5134L16.4319 24.5134L16.4281 24.5134L16.4242 24.5133L16.4203 24.5133L16.4164 24.5133L16.4126 24.5132L16.4087 24.5132L16.4048 24.5131L16.4009 24.5131L16.397 24.5131L16.3932 24.513L16.3893 24.513L16.3854 24.513L16.3815 24.5129L16.3777 24.5129L16.3738 24.5128L16.3699 24.5128L16.366 24.5128L16.3621 24.5127L16.3583 24.5127L16.3544 24.5127L16.3505 24.5126L16.3466 24.5126L16.3427 24.5126L16.3389 24.5125L16.335 24.5125L16.3311 24.5124L16.3272 24.5124L16.3233 24.5124L16.3195 24.5123L16.3156 24.5123L16.3117 24.5123L16.3078 24.5122L16.3039 24.5122L16.3 24.5121L16.2962 24.5121L16.2923 24.5121L16.2884 24.512L16.2845 24.512L16.2806 24.512L16.2768 24.5119L16.2729 24.5119L16.269 24.5118L16.2651 24.5118L16.2612 24.5118L16.2573 24.5117L16.2535 24.5117L16.2496 24.5117L16.2457 24.5116L16.2418 24.5116L16.2379 24.5116L16.234 24.5115L16.2301 24.5115L16.2263 24.5114L16.2224 24.5114L16.2185 24.5114L16.2146 24.5113L16.2107 24.5113L16.2068 24.5113L16.2029 24.5112L16.1991 24.5112L16.1952 24.5111L16.1913 24.5111L16.1874 24.5111L16.1835 24.511L16.1796 24.511L16.1757 24.511L16.1719 24.5109L16.168 24.5109L16.1641 24.5108L16.1602 24.5108L16.1563 24.5108L16.1524 24.5107L16.1485 24.5107L16.1446 24.5107L16.1407 24.5106L16.1369 24.5106L16.133 24.5105L16.1291 24.5105L16.1252 24.5105L16.1213 24.5104L16.1174 24.5104L16.1135 24.5104L16.1096 24.5103L16.1057 24.5103L16.1018 24.5102L16.098 24.5102L16.0941 24.5102L16.0902 24.5101L16.0863 24.5101L16.0824 24.5101L16.0785 24.51L16.0746 24.51L16.0707 24.51L16.0668 24.5099L16.0629 24.5099L16.059 24.5098L16.0551 24.5098L16.0512 24.5098L16.0473 24.5097L16.0435 24.5097L16.0396 24.5097L16.0357 24.5096L16.0318 24.5096L16.0279 24.5095L16.024 24.5095L16.0201 24.5095L16.0162 24.5094L16.0123 24.5094L16.0084 24.5094L16.0045 24.5093L16.0006 24.5093L15.9967 24.5092L15.9928 24.5092L15.9889 24.5092L15.985 24.5091L15.9811 24.5091L15.9772 24.5091L15.9733 24.509L15.9694 24.509L15.9655 24.5089L15.9616 24.5089L15.9577 24.5089L15.9538 24.5088L15.9499 24.5088L15.946 24.5088L15.9421 24.5087L15.9382 24.5087L15.9343 24.5086L15.9304 24.5086L15.9265 24.5086L15.9226 24.5085L15.9187 24.5085L15.9148 24.5085L15.9109 24.5084L15.907 24.5084L15.9031 24.5083L15.8992 24.5083L15.8953 24.5083L15.8914 24.5082L15.8875 24.5082L15.8836 24.5082L15.8797 24.5081L15.8758 24.5081L15.8719 24.5081L15.868 24.508L15.8641 24.508L15.8601 24.5079L15.8562 24.5079L15.8523 24.5079L15.8484 24.5078L15.8445 24.5078L15.8406 24.5078L15.8367 24.5077L15.8328 24.5077L15.8289 24.5076L15.825 24.5076L15.8211 24.5076L15.8172 24.5075L15.8133 24.5075L15.8093 24.5075L15.8054 24.5074L15.8015 24.5074L15.7976 24.5073L15.7937 24.5073L15.7898 24.5073L15.7859 24.5072L15.782 24.5072L15.7781 24.5072L15.7742 24.5071L15.7702 24.5071L15.7663 24.507L15.7624 24.507L15.7585 24.507L15.7546 24.5069L15.7507 24.5069L15.7468 24.5069L15.7428 24.5068L15.7389 24.5068L15.735 24.5067L15.7311 24.5067L15.7272 24.5067L15.7233 24.5066L15.7194 24.5066L15.7154 24.5066L15.7115 24.5065L15.7076 24.5065L15.7037 24.5064L15.6998 24.5064L15.6959 24.5064L15.6919 24.5063L15.688 24.5063L15.6841 24.5063L15.6802 24.5062L15.6763 24.5062L15.6723 24.5061L15.6684 24.5061L15.6645 24.5061L15.6606 24.506L15.6567 24.506L15.6527 24.506L15.6488 24.5059L15.6449 24.5059L15.641 24.5058L15.6371 24.5058L15.6331 24.5058L15.6292 24.5057L15.6253 24.5057L15.6214 24.5057L15.6174 24.5056L15.6135 24.5056L15.6096 24.5055L15.6057 24.5055L15.6017 24.5055L15.5978 24.5054L15.5939 24.5054L15.59 24.5054L15.586 24.5053L15.5821 24.5053L15.5782 24.5052L15.5743 24.5052L15.5703 24.5052L15.5664 24.5051L15.5625 24.5051L15.5585 24.5051L15.5546 24.505L15.5507 24.505L15.5468 24.5049L15.5428 24.5049L15.5389 24.5049L15.535 24.5048L15.531 24.5048L15.5271 24.5048L15.5232 24.5047L15.5192 24.5047L15.5153 24.5046L15.5114 24.5046L15.5074 24.5046L15.5048 24.5045L15.5048 24.5017L15.5049 24.494L15.505 24.4862L15.5051 24.4785L15.5051 24.4708L15.5052 24.463L15.5053 24.4553L15.5054 24.4476L15.5054 24.4398L15.5055 24.4321L15.5056 24.4243L15.5057 24.4166L15.5057 24.4089L15.5058 24.4011L15.5059 24.3934L15.5059 24.3856L15.506 24.3779L15.5061 24.3702L15.5062 24.3624L15.5062 24.3547L15.5063 24.3469L15.5064 24.3392L15.5065 24.3315L15.5065 24.3237L15.5066 24.316L15.5067 24.3082L15.5068 24.3005L15.5068 24.2928L15.5069 24.285L15.507 24.2773L15.5071 24.2695L15.5071 24.2618L15.5072 24.254L15.5073 24.2463L15.5074 24.2386L15.5074 24.2308L15.5075 24.2231L15.5076 24.2153L15.5077 24.2076L15.5077 24.1998L15.5078 24.1921L15.5079 24.1844L15.5079 24.1766L15.508 24.1689L15.5081 24.1611L15.5082 24.1534L15.5082 24.1456L15.5083 24.1379L15.5084 24.1301L15.5085 24.1224L15.5085 24.1147L15.5086 24.1069L15.5087 24.0992L15.5088 24.0914L15.5088 24.0837L15.5089 24.0759L15.509 24.0682L15.5091 24.0604L15.5091 24.0527L15.5092 24.0449L15.5093 24.0372L15.5094 24.0294L15.5094 24.0217L15.5095 24.0139L15.5096 24.0062L15.5097 23.9984L15.5097 23.9907L15.5098 23.9829L15.5099 23.9752L15.5099 23.9674L15.51 23.9597L15.5101 23.9519L15.5102 23.9442L15.5102 23.9364L15.5103 23.9287L15.5104 23.9209L15.5105 23.9132L15.5105 23.9054L15.5106 23.8977L15.5107 23.8899L15.5108 23.8822L15.5108 23.8744L15.5109 23.8667L15.511 23.8589L15.5111 23.8512L15.5111 23.8434L15.5112 23.8357L15.5113 23.8279L15.5114 23.8201L15.5114 23.8124L15.5115 23.8046L15.5116 23.7969L15.5117 23.7891L15.5117 23.7814L15.5118 23.7736L15.5119 23.7659L15.5119 23.7581L15.512 23.7503L15.5121 23.7426L15.5122 23.7348L15.5122 23.7271L15.5123 23.7193L15.5124 23.7115L15.5125 23.7038L15.5125 23.696L15.5126 23.6883L15.5127 23.6805L15.5128 23.6727L15.5128 23.665L15.5129 23.6572L15.513 23.6495L15.5131 23.6417L15.5131 23.6339L15.5132 23.6262L15.5133 23.6184L15.5134 23.6107L15.5134 23.6029L15.5135 23.5951L15.5136 23.5874L15.5137 23.5796L15.5137 23.5718L15.5138 23.5641L15.5139 23.5563L15.514 23.5485L15.514 23.5408L15.5141 23.533L15.5142 23.5252L15.5142 23.5175L15.5143 23.5097L15.5144 23.5019L15.5145 23.4942L15.5145 23.4864L15.5146 23.4786L15.5147 23.4709L15.5148 23.4631L15.5148 23.4553L15.5149 23.4476L15.515 23.4398L15.5151 23.432L15.5151 23.4242L15.5152 23.4165L15.5153 23.4087L15.5154 23.4009L15.5154 23.3932L15.5155 23.3854L15.5156 23.3776L15.5157 23.3698L15.5157 23.3621L15.5158 23.3543L15.5159 23.3465L15.516 23.3387L15.516 23.331L15.5161 23.3232L15.5162 23.3154L15.5163 23.3076L15.5163 23.2999L15.5164 23.2921L15.5165 23.2843L15.5166 23.2765L15.5166 23.2687L15.5167 23.261L15.5168 23.2532L15.5169 23.2454L15.5169 23.2376L15.517 23.2298L15.5171 23.2221L15.5171 23.2143L15.5172 23.2065L15.5173 23.1987L15.5174 23.1909L15.5174 23.1832L15.5175 23.1754L15.5176 23.1676L15.5177 23.1598L15.5177 23.152L15.5178 23.1442L15.5179 23.1364L15.518 23.1287L15.518 23.1209L15.5181 23.1131L15.5182 23.1053L15.5183 23.0975L15.5183 23.0897L15.5184 23.0819L15.5185 23.0741L15.5186 23.0664L15.5186 23.0586L15.5187 23.0508L15.5188 23.043L15.5189 23.0352L15.5189 23.0274L15.519 23.0196L15.5191 23.0118L15.5192 23.004L15.5192 22.9962L15.5193 22.9884L15.5194 22.9806L15.5195 22.9728L15.5195 22.965L15.5196 22.9573L15.5197 22.9495L15.5198 22.9417L15.5198 22.9339L15.5199 22.9261L15.52 22.9183L15.5201 22.9105L15.5201 22.9027L15.5202 22.8949L15.5203 22.8871L15.5204 22.8793L15.5204 22.8715L15.5205 22.8637L15.5206 22.8559L15.5207 22.8481L15.5207 22.8403L15.5208 22.8324L15.5209 22.8246L15.5209 22.8168L15.521 22.809L15.5211 22.8012L15.5212 22.7934L15.5212 22.7856L15.5213 22.7778L15.5214 22.77L15.5215 22.7622L15.5215 22.7544L15.5216 22.7466L15.5217 22.7388L15.5218 22.731L15.5218 22.7231L15.5219 22.7153L15.522 22.7075L15.5221 22.6997L15.5221 22.6919L15.5222 22.6841L15.5223 22.6763L15.5224 22.6685L15.5224 22.6606L15.5225 22.6528L15.5226 22.645L15.5227 22.6372L15.5227 22.6294L15.5228 22.6216L15.5229 22.6137L15.523 22.6059L15.523 22.5981L15.5231 22.5903L15.5232 22.5825L15.5233 22.5746L15.5233 22.5668L15.5234 22.559L15.5235 22.5512L15.5236 22.5433L15.5236 22.5355L15.5237 22.5277L15.5238 22.5199L15.5239 22.512L15.5239 22.5042L15.524 22.4964L15.5241 22.4886L15.5242 22.4807L15.5242 22.4729L15.5243 22.4651L15.5244 22.4572L15.5245 22.4494L15.5245 22.4416L15.5246 22.4337L15.5247 22.4259L15.5248 22.4181L15.5248 22.4103L15.5249 22.4024L15.525 22.3946L15.5251 22.3867L15.5251 22.3789L15.5252 22.3711L15.5253 22.3632L15.5254 22.3554L15.5254 22.3476L15.5255 22.3397L15.5256 22.3319L15.5257 22.324L15.5257 22.3162L15.5258 22.3084L15.5259 22.3005L15.526 22.2927L15.526 22.2848L15.5261 22.277L15.5262 22.2691L15.5263 22.2613L15.5263 22.2535L15.5264 22.2456L15.5265 22.2378L15.5266 22.2299L15.5266 22.2221L15.5267 22.2142L15.5268 22.2064L15.5269 22.1985L15.5269 22.1907L15.527 22.1828L15.5271 22.175L15.5272 22.1671L15.5272 22.1593L15.5273 22.1514L15.5274 22.1435L15.5275 22.1357L15.5275 22.1278L15.5276 22.12L15.5277 22.1121L15.5278 22.1043L15.5278 22.0964L15.5279 22.0885L15.528 22.0807L15.5281 22.0728L15.5281 22.065L15.5282 22.0571L15.5283 22.0492L15.5284 22.0414L15.5284 22.0335L15.5285 22.0256L15.5286 22.0178L15.5287 22.0099L15.5287 22.002L15.5288 21.9942L15.5289 21.9863L15.529 21.9784L15.529 21.9706L15.5291 21.9627L15.5292 21.9548L15.5293 21.947L15.5293 21.9391L15.5294 21.9312L15.5295 21.9233L15.5296 21.9155L15.5296 21.9076L15.5297 21.8997L15.5298 21.8918L15.5299 21.884L15.5299 21.8761L15.53 21.8682L15.5301 21.8603L15.5302 21.8524L15.5302 21.8446L15.5303 21.8367L15.5304 21.8288L15.5305 21.8209L15.5305 21.813L15.5306 21.8051L15.5307 21.7973L15.5308 21.7894L15.5308 21.7815L15.5309 21.7736L15.531 21.7657L15.5311 21.7578L15.5312 21.7499L15.5312 21.742L15.5313 21.7341L15.5314 21.7263L15.5315 21.7184L15.5315 21.7105L15.5316 21.7026L15.5317 21.6947L15.5318 21.6868L15.5318 21.6789L15.5319 21.671L15.532 21.6631L15.5321 21.6552L15.5321 21.6473L15.5322 21.6394L15.5323 21.6315L15.5324 21.6236L15.5324 21.6157L15.5325 21.6078L15.5326 21.5999L15.5327 21.592L15.5327 21.5841L15.5328 21.5762L15.5329 21.5683L15.533 21.5603L15.533 21.5524L15.5331 21.5445L15.5332 21.5366L15.5333 21.5287L15.5333 21.5208L15.5334 21.5129L15.5335 21.505L15.5335 21.5047L15.5366 21.5047L15.5404 21.5047L15.5443 21.5048L15.5482 21.5048L15.5521 21.5049L15.5559 21.5049L15.5598 21.5049L15.5637 21.505L15.5676 21.505L15.5714 21.505L15.5753 21.5051L15.5792 21.5051L15.5831 21.5052L15.5869 21.5052L15.5908 21.5052L15.5947 21.5053L15.5986 21.5053L15.6024 21.5053L15.6063 21.5054L15.6102 21.5054L15.6141 21.5054L15.618 21.5055L15.6218 21.5055L15.6257 21.5056L15.6296 21.5056L15.6335 21.5056L15.6373 21.5057L15.6412 21.5057L15.6451 21.5057L15.649 21.5058L15.6529 21.5058L15.6567 21.5059L15.6606 21.5059L15.6645 21.5059L15.6684 21.506L15.6722 21.506L15.6761 21.506L15.68 21.5061L15.6839 21.5061L15.6878 21.5062L15.6916 21.5062L15.6955 21.5062L15.6994 21.5063L15.7033 21.5063L15.7072 21.5063L15.711 21.5064L15.7149 21.5064L15.7188 21.5064L15.7227 21.5065L15.7266 21.5065L15.7304 21.5066L15.7343 21.5066L15.7382 21.5066L15.7421 21.5067L15.746 21.5067L15.7499 21.5067L15.7537 21.5068L15.7576 21.5068L15.7615 21.5069L15.7654 21.5069L15.7693 21.5069L15.7732 21.507L15.777 21.507L15.7809 21.507L15.7848 21.5071L15.7887 21.5071L15.7926 21.5072L15.7965 21.5072L15.8003 21.5072L15.8042 21.5073L15.8081 21.5073L15.812 21.5073L15.8159 21.5074L15.8198 21.5074L15.8237 21.5075L15.8275 21.5075L15.8314 21.5075L15.8353 21.5076L15.8392 21.5076L15.8431 21.5076L15.847 21.5077L15.8509 21.5077L15.8547 21.5077L15.8586 21.5078L15.8625 21.5078L15.8664 21.5079L15.8703 21.5079L15.8742 21.5079L15.8781 21.508L15.882 21.508L15.8858 21.508L15.8897 21.5081L15.8936 21.5081L15.8975 21.5082L15.9014 21.5082L15.9053 21.5082L15.9092 21.5083L15.9131 21.5083L15.917 21.5083L15.9209 21.5084L15.9247 21.5084L15.9286 21.5085L15.9325 21.5085L15.9364 21.5085L15.9403 21.5086L15.9442 21.5086L15.9481 21.5086L15.952 21.5087L15.9559 21.5087L15.9598 21.5088L15.9637 21.5088L15.9676 21.5088L15.9714 21.5089L15.9753 21.5089L15.9792 21.5089L15.9831 21.509L15.987 21.509L15.9909 21.5091L15.9948 21.5091L15.9987 21.5091L16.0026 21.5092L16.0065 21.5092L16.0104 21.5092L16.0143 21.5093L16.0182 21.5093L16.0221 21.5093L16.026 21.5094L16.0299 21.5094L16.0338 21.5095L16.0377 21.5095L16.0416 21.5095L16.0455 21.5096L16.0494 21.5096L16.0533 21.5096L16.0572 21.5097L16.061 21.5097L16.0649 21.5098L16.0688 21.5098L16.0727 21.5098L16.0766 21.5099L16.0805 21.5099L16.0844 21.5099L16.0883 21.51L16.0922 21.51L16.0961 21.5101L16.1 21.5101L16.1039 21.5101L16.1078 21.5102L16.1117 21.5102L16.1157 21.5102L16.1196 21.5103L16.1235 21.5103L16.1274 21.5104L16.1313 21.5104L16.1352 21.5104L16.1391 21.5105L16.143 21.5105L16.1469 21.5105L16.1508 21.5106L16.1547 21.5106L16.1586 21.5107L16.1625 21.5107L16.1664 21.5107L16.1703 21.5108L16.1742 21.5108L16.1781 21.5108L16.182 21.5109L16.1859 21.5109L16.1898 21.511L16.1937 21.511L16.1976 21.511L16.2016 21.5111L16.2055 21.5111L16.2094 21.5111L16.2133 21.5112L16.2172 21.5112L16.2211 21.5113L16.225 21.5113L16.2289 21.5113L16.2328 21.5114L16.2367 21.5114L16.2406 21.5114L16.2446 21.5115L16.2485 21.5115L16.2524 21.5116L16.2563 21.5116L16.2602 21.5116L16.2641 21.5117L16.268 21.5117L16.2719 21.5117L16.2758 21.5118L16.2798 21.5118L16.2837 21.5119L16.2876 21.5119L16.2915 21.5119L16.2954 21.512L16.2993 21.512L16.3032 21.512L16.3072 21.5121L16.3111 21.5121L16.315 21.5122L16.3189 21.5122L16.3228 21.5122L16.3267 21.5123L16.3307 21.5123L16.3346 21.5123L16.3385 21.5124L16.3424 21.5124L16.3463 21.5124L16.3502 21.5125L16.3542 21.5125L16.3581 21.5126L16.362 21.5126L16.3659 21.5126L16.3698 21.5127L16.3738 21.5127L16.3777 21.5127L16.3816 21.5128L16.3855 21.5128L16.3894 21.5129L16.3934 21.5129L16.3973 21.5129L16.4012 21.513L16.4051 21.513L16.4091 21.513L16.413 21.5131L16.4169 21.5131L16.4208 21.5132L16.4247 21.5132L16.4287 21.5132L16.4326 21.5133L16.4365 21.5133L16.4404 21.5133L16.4444 21.5134L16.4483 21.5134L16.4522 21.5135L16.4561 21.5135L16.4601 21.5135L16.464 21.5136L16.4679 21.5136L16.4719 21.5137L16.4758 21.5137L16.4797 21.5137L16.4836 21.5138L16.4876 21.5138L16.4915 21.5138L16.4954 21.5139L16.4994 21.5139L16.5033 21.514L16.5072 21.514L16.5112 21.514L16.5151 21.5141L16.519 21.5141L16.523 21.5141L16.5269 21.5142L16.5308 21.5142L16.5335 21.5142Z"
            fill="black"
            stroke={props.color}
          />
          <Path
            d="M4.5 14.5H4.50306H4.50694H4.51081H4.51469H4.51856H4.52244H4.52631H4.53019H4.53406H4.53794H4.54182H4.54569H4.54957H4.55344H4.55732H4.5612H4.56507H4.56895H4.57283H4.5767H4.58058H4.58446H4.58834H4.59221H4.59609H4.59997H4.60385H4.60773H4.6116H4.61548H4.61936H4.62324H4.62712H4.631H4.63488H4.63876H4.64263H4.64651H4.65039H4.65427H4.65815H4.66203H4.66591H4.66979H4.67368H4.67756H4.68144H4.68532H4.6892H4.69308H4.69696H4.70084H4.70473H4.70861H4.71249H4.71637H4.72026H4.72414H4.72802H4.7319H4.73579H4.73967H4.74355H4.74744H4.75132H4.75521H4.75909H4.76298H4.76686H4.77074H4.77463H4.77851H4.7824H4.78629H4.79017H4.79406H4.79794H4.80183H4.80572H4.8096H4.81349H4.81738H4.82126H4.82515H4.82904H4.83293H4.83681H4.8407H4.84459H4.84848H4.85237H4.85626H4.86015H4.86404H4.86792H4.87181H4.8757H4.87959H4.88348H4.88738H4.89127H4.89516H4.89905H4.90294H4.90683H4.91072H4.91461H4.91851H4.9224H4.92629H4.93018H4.93408H4.93797H4.94186H4.94576H4.94965H4.95355H4.95744H4.96134H4.96523H4.96913H4.97302H4.97692H4.98081H4.98471H4.9886H4.9925H4.9964H5.00029H5.00419H5.00809H5.01199H5.01588H5.01978H5.02368H5.02758H5.03148H5.03538H5.03927H5.04317H5.04707H5.05097H5.05487H5.05877H5.06267H5.06658H5.07048H5.07438H5.07828H5.08218H5.08608H5.08999H5.09389H5.09779H5.10169H5.1056H5.1095H5.11341H5.11731H5.12121H5.12512H5.12902H5.13293H5.13683H5.14074H5.14465H5.14855H5.15246H5.15637H5.16027H5.16418H5.16809H5.17199H5.1759H5.17981H5.18372H5.18763H5.19154H5.19545H5.19936H5.20327H5.20718H5.21109H5.215H5.21891H5.22282H5.22673H5.23065H5.23456H5.23847H5.24238H5.2463H5.25021H5.25412H5.25804H5.26195H5.26587H5.26978H5.2737H5.27761H5.28153H5.28544H5.28936H5.29328H5.29719H5.30111H5.30503H5.30895H5.31286H5.31678H5.3207H5.32462H5.32854H5.33246H5.33638H5.3403H5.34422H5.34814H5.35206H5.35598H5.3599H5.36383H5.36775H5.37167H5.37559H5.37952H5.38344H5.38737H5.39129H5.39521H5.39914H5.40307H5.40699H5.41092H5.41484H5.41877H5.4227H5.42662H5.43055H5.43448H5.43841H5.44234H5.44626H5.45019H5.45412H5.45805H5.46198H5.46591H5.46985H5.47378H5.47771H5.48164H5.48557H5.4895H5.49344H5.49737H5.5V14.5031V14.5069V14.5108V14.5147V14.5186V14.5224V14.5263V14.5302V14.5341V14.5379V14.5418V14.5457V14.5496V14.5534V14.5573V14.5612V14.5651V14.5689V14.5728V14.5767V14.5806V14.5845V14.5883V14.5922V14.5961V14.6V14.6038V14.6077V14.6116V14.6155V14.6194V14.6232V14.6271V14.631V14.6349V14.6388V14.6426V14.6465V14.6504V14.6543V14.6582V14.662V14.6659V14.6698V14.6737V14.6776V14.6814V14.6853V14.6892V14.6931V14.697V14.7008V14.7047V14.7086V14.7125V14.7164V14.7203V14.7241V14.728V14.7319V14.7358V14.7397V14.7436V14.7474V14.7513V14.7552V14.7591V14.763V14.7669V14.7707V14.7746V14.7785V14.7824V14.7863V14.7902V14.7941V14.7979V14.8018V14.8057V14.8096V14.8135V14.8174V14.8213V14.8252V14.829V14.8329V14.8368V14.8407V14.8446V14.8485V14.8524V14.8563V14.8601V14.864V14.8679V14.8718V14.8757V14.8796V14.8835V14.8874V14.8913V14.8952V14.899V14.9029V14.9068V14.9107V14.9146V14.9185V14.9224V14.9263V14.9302V14.9341V14.938V14.9419V14.9458V14.9497V14.9535V14.9574V14.9613V14.9652V14.9691V14.973V14.9769V14.9808V14.9847V14.9886V14.9925V14.9964V15.0003V15.0042V15.0081V15.012V15.0159V15.0198V15.0237V15.0276V15.0315V15.0354V15.0393V15.0432V15.0471V15.051V15.0549V15.0588V15.0627V15.0666V15.0705V15.0744V15.0783V15.0822V15.0861V15.09V15.0939V15.0978V15.1017V15.1056V15.1095V15.1134V15.1173V15.1212V15.1251V15.129V15.1329V15.1368V15.1407V15.1446V15.1486V15.1525V15.1564V15.1603V15.1642V15.1681V15.172V15.1759V15.1798V15.1837V15.1876V15.1915V15.1954V15.1994V15.2033V15.2072V15.2111V15.215V15.2189V15.2228V15.2267V15.2306V15.2346V15.2385V15.2424V15.2463V15.2502V15.2541V15.258V15.262V15.2659V15.2698V15.2737V15.2776V15.2815V15.2854V15.2894V15.2933V15.2972V15.3011V15.305V15.3089V15.3129V15.3168V15.3207V15.3246V15.3285V15.3325V15.3364V15.3403V15.3442V15.3481V15.3521V15.356V15.3599V15.3638V15.3677V15.3717V15.3756V15.3795V15.3834V15.3874V15.3913V15.3952V15.3991V15.4031V15.407V15.4109V15.4148V15.4188V15.4227V15.4266V15.4306V15.4345V15.4384V15.4423V15.4463V15.4502V15.4541V15.4581V15.462V15.4659V15.4698V15.4738V15.4777V15.4816V15.4856V15.4895V15.4934V15.4974V15.5H5.49694H5.49306H5.48919H5.48531H5.48144H5.47756H5.47369H5.46981H5.46594H5.46206H5.45818H5.45431H5.45043H5.44656H5.44268H5.4388H5.43493H5.43105H5.42717H5.4233H5.41942H5.41554H5.41166H5.40779H5.40391H5.40003H5.39615H5.39227H5.3884H5.38452H5.38064H5.37676H5.37288H5.369H5.36512H5.36124H5.35737H5.35349H5.34961H5.34573H5.34185H5.33797H5.33409H5.33021H5.32632H5.32244H5.31856H5.31468H5.3108H5.30692H5.30304H5.29916H5.29527H5.29139H5.28751H5.28363H5.27974H5.27586H5.27198H5.2681H5.26421H5.26033H5.25645H5.25256H5.24868H5.24479H5.24091H5.23702H5.23314H5.22926H5.22537H5.22149H5.2176H5.21371H5.20983H5.20594H5.20206H5.19817H5.19428H5.1904H5.18651H5.18262H5.17874H5.17485H5.17096H5.16707H5.16319H5.1593H5.15541H5.15152H5.14763H5.14374H5.13985H5.13596H5.13208H5.12819H5.1243H5.12041H5.11652H5.11262H5.10873H5.10484H5.10095H5.09706H5.09317H5.08928H5.08539H5.08149H5.0776H5.07371H5.06982H5.06592H5.06203H5.05814H5.05424H5.05035H5.04645H5.04256H5.03866H5.03477H5.03087H5.02698H5.02308H5.01919H5.01529H5.0114H5.0075H5.0036H4.99971H4.99581H4.99191H4.98801H4.98412H4.98022H4.97632H4.97242H4.96852H4.96462H4.96073H4.95683H4.95293H4.94903H4.94513H4.94123H4.93733H4.93342H4.92952H4.92562H4.92172H4.91782H4.91392H4.91001H4.90611H4.90221H4.89831H4.8944H4.8905H4.88659H4.88269H4.87879H4.87488H4.87098H4.86707H4.86317H4.85926H4.85535H4.85145H4.84754H4.84363H4.83973H4.83582H4.83191H4.82801H4.8241H4.82019H4.81628H4.81237H4.80846H4.80455H4.80064H4.79673H4.79282H4.78891H4.785H4.78109H4.77718H4.77327H4.76935H4.76544H4.76153H4.75762H4.7537H4.74979H4.74588H4.74196H4.73805H4.73413H4.73022H4.7263H4.72239H4.71847H4.71456H4.71064H4.70672H4.70281H4.69889H4.69497H4.69105H4.68714H4.68322H4.6793H4.67538H4.67146H4.66754H4.66362H4.6597H4.65578H4.65186H4.64794H4.64402H4.6401H4.63617H4.63225H4.62833H4.62441H4.62048H4.61656H4.61263H4.60871H4.60479H4.60086H4.59693H4.59301H4.58908H4.58516H4.58123H4.5773H4.57338H4.56945H4.56552H4.56159H4.55766H4.55374H4.54981H4.54588H4.54195H4.53802H4.53409H4.53016H4.52622H4.52229H4.51836H4.51443H4.5105H4.50656H4.50263H4.5V15.4969V15.4931V15.4892V15.4853V15.4814V15.4776V15.4737V15.4698V15.4659V15.4621V15.4582V15.4543V15.4504V15.4466V15.4427V15.4388V15.4349V15.4311V15.4272V15.4233V15.4194V15.4155V15.4117V15.4078V15.4039V15.4V15.3962V15.3923V15.3884V15.3845V15.3806V15.3768V15.3729V15.369V15.3651V15.3612V15.3574V15.3535V15.3496V15.3457V15.3418V15.338V15.3341V15.3302V15.3263V15.3224V15.3186V15.3147V15.3108V15.3069V15.303V15.2992V15.2953V15.2914V15.2875V15.2836V15.2797V15.2759V15.272V15.2681V15.2642V15.2603V15.2564V15.2526V15.2487V15.2448V15.2409V15.237V15.2331V15.2293V15.2254V15.2215V15.2176V15.2137V15.2098V15.2059V15.2021V15.1982V15.1943V15.1904V15.1865V15.1826V15.1787V15.1748V15.171V15.1671V15.1632V15.1593V15.1554V15.1515V15.1476V15.1437V15.1399V15.136V15.1321V15.1282V15.1243V15.1204V15.1165V15.1126V15.1087V15.1048V15.101V15.0971V15.0932V15.0893V15.0854V15.0815V15.0776V15.0737V15.0698V15.0659V15.062V15.0581V15.0542V15.0503V15.0465V15.0426V15.0387V15.0348V15.0309V15.027V15.0231V15.0192V15.0153V15.0114V15.0075V15.0036V14.9997V14.9958V14.9919V14.988V14.9841V14.9802V14.9763V14.9724V14.9685V14.9646V14.9607V14.9568V14.9529V14.949V14.9451V14.9412V14.9373V14.9334V14.9295V14.9256V14.9217V14.9178V14.9139V14.91V14.9061V14.9022V14.8983V14.8944V14.8905V14.8866V14.8827V14.8788V14.8749V14.871V14.8671V14.8632V14.8593V14.8554V14.8514V14.8475V14.8436V14.8397V14.8358V14.8319V14.828V14.8241V14.8202V14.8163V14.8124V14.8085V14.8046V14.8006V14.7967V14.7928V14.7889V14.785V14.7811V14.7772V14.7733V14.7694V14.7654V14.7615V14.7576V14.7537V14.7498V14.7459V14.742V14.738V14.7341V14.7302V14.7263V14.7224V14.7185V14.7146V14.7106V14.7067V14.7028V14.6989V14.695V14.6911V14.6871V14.6832V14.6793V14.6754V14.6715V14.6675V14.6636V14.6597V14.6558V14.6519V14.6479V14.644V14.6401V14.6362V14.6323V14.6283V14.6244V14.6205V14.6166V14.6126V14.6087V14.6048V14.6009V14.5969V14.593V14.5891V14.5852V14.5812V14.5773V14.5734V14.5694V14.5655V14.5616V14.5577V14.5537V14.5498V14.5459V14.5419V14.538V14.5341V14.5302V14.5262V14.5223V14.5184V14.5144V14.5105V14.5066V14.5026V14.5Z"
            fill="black"
            stroke={props.color}
          />
          <Rect
            x="5.25"
            y="5.25"
            width="5.5"
            height="5.5"
            stroke={props.color}
            strokeWidth="2.5"
          />
          <Rect
            x="18.25"
            y="5.25"
            width="5.5"
            height="5.5"
            stroke={props.color}
            strokeWidth="2.5"
          />
          <Rect
            x="5.25"
            y="19.25"
            width="5.5"
            height="5.5"
            stroke={props.color}
            strokeWidth="2.5"
          />
          <Path d="M0 2C0 0.895431 0.895431 0 2 0H6V2H0Z" fill={props.color} />
          <Path
            d="M1.99988 0L2.05938 5.92789L0.059481 5.94796L0.020053 2.01997C0.00896626 0.915459 0.895364 0.0110868 1.99988 0Z"
            fill={props.color}
          />
          <Path
            d="M29 2C29 0.895431 28.1046 0 27 0H23V2H29Z"
            fill={props.color}
          />
          <Path
            d="M27.0001 0L26.9406 5.92789L28.9405 5.94796L28.9799 2.01997C28.991 0.915459 28.1046 0.0110868 27.0001 0Z"
            fill={props.color}
          />
          <Path
            d="M29 26.9478C29 28.0523 28.1046 28.9478 27 28.9478H23V26.9478H29Z"
            fill={props.color}
          />
          <Path
            d="M27.0001 28.9478L26.9406 23.0199L28.9405 22.9998L28.9799 26.9278C28.991 28.0323 28.1046 28.9367 27.0001 28.9478Z"
            fill={props.color}
          />
          <Path
            d="M0 26.9478C0 28.0523 0.895431 28.9478 2 28.9478H6V26.9478H0Z"
            fill={props.color}
          />
          <Path
            d="M1.99988 28.9478L2.05938 23.0199L0.059481 22.9998L0.020053 26.9278C0.00896626 28.0323 0.895364 28.9367 1.99988 28.9478Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Server:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 41 55"
          fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0 0H41V17H0V0ZM4 4H13V13H4V4ZM18 4H15V13H18V4Z"
            fill={props.color}
          />
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0 21H41V38H0V21ZM4 25H13V34H4V25ZM18 25H15V34H18V25Z"
            fill={props.color}
          />
          <Rect y="51" width="41" height="3" fill={props.color} />
          <Rect
            x="15"
            y="50"
            width="10"
            height="5"
            rx="2.5"
            fill={props.color}
          />
          <Rect x="19" y="36" width="2" height="18" fill={props.color} />
        </Svg>
      );

    case CustomIcons.Save:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 12 12"
          fill="none">
          <Path
            d="M12 11.3333V3.60933C12 3.43254 11.9297 3.263 11.8047 3.138L8.862 0.195333C8.737 0.0703004 8.56746 3.77583e-05 8.39067 0H0.666667C0.489856 0 0.320286 0.0702379 0.195262 0.195262C0.0702379 0.320286 0 0.489856 0 0.666667V11.3333C0 11.5101 0.0702379 11.6797 0.195262 11.8047C0.320286 11.9298 0.489856 12 0.666667 12H11.3333C11.5101 12 11.6797 11.9298 11.8047 11.8047C11.9298 11.6797 12 11.5101 12 11.3333ZM4 3.33333H6.66667C6.84348 3.33333 7.01305 3.40357 7.13807 3.5286C7.2631 3.65362 7.33333 3.82319 7.33333 4C7.33333 4.17681 7.2631 4.34638 7.13807 4.4714C7.01305 4.59643 6.84348 4.66667 6.66667 4.66667H4C3.82319 4.66667 3.65362 4.59643 3.5286 4.4714C3.40357 4.34638 3.33333 4.17681 3.33333 4C3.33333 3.82319 3.40357 3.65362 3.5286 3.5286C3.65362 3.40357 3.82319 3.33333 4 3.33333ZM8.66667 10.6667H3.33333V8C3.33333 7.82319 3.40357 7.65362 3.5286 7.5286C3.65362 7.40357 3.82319 7.33333 4 7.33333H8C8.17681 7.33333 8.34638 7.40357 8.47141 7.5286C8.59643 7.65362 8.66667 7.82319 8.66667 8V10.6667Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.GreenTick:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 12 12"
          fill="none">
          <Path
            d="M8.51824 0H3.48774C1.30265 0 0 1.302 0 3.486V8.508C0 10.698 1.30265 12 3.48774 12H8.51224C10.6973 12 12 10.698 12 8.514V3.486C12.006 1.302 10.7033 0 8.51824 0ZM8.87242 4.62L5.46872 8.022C5.38468 8.106 5.27063 8.154 5.15057 8.154C5.03051 8.154 4.91645 8.106 4.83241 8.022L3.13356 6.324C2.95947 6.15 2.95947 5.862 3.13356 5.688C3.30765 5.514 3.59579 5.514 3.76988 5.688L5.15057 7.068L8.2361 3.984C8.41019 3.81 8.69833 3.81 8.87242 3.984C9.04651 4.158 9.04651 4.44 8.87242 4.62Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Delete:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 29 29"
          fill="none">
          <G clipPath="url(#clip0_196_1254)">
            <Path
              d="M24.1856 6.40039C17.7931 6.40039 11.4007 6.40039 4.8145 6.40039C4.80765 11.3644 4.80765 11.3644 4.80621 13.437C4.80587 13.9114 4.80553 14.3858 4.80517 14.8602C4.8051 14.9494 4.8051 14.9494 4.80503 15.0404C4.80429 15.9999 4.80296 16.9595 4.80139 17.9191C4.79981 18.9041 4.79886 19.8891 4.79852 20.874C4.79828 21.4817 4.79755 22.0893 4.79617 22.697C4.79527 23.1138 4.795 23.5307 4.79522 23.9475C4.79533 24.1879 4.79516 24.4283 4.79425 24.6687C4.79342 24.8891 4.79338 25.1094 4.79396 25.3298C4.79403 25.4093 4.79382 25.4887 4.79328 25.5682C4.78731 26.5087 5.04432 27.4042 5.7119 28.0962C6.36636 28.6902 7.12077 29.018 8.00065 29.0151C8.08718 29.0155 8.08718 29.0155 8.17545 29.0159C8.36832 29.0166 8.56118 29.0165 8.75406 29.0165C8.89252 29.0168 9.03098 29.0172 9.16944 29.0176C9.50631 29.0185 9.84317 29.0189 10.18 29.0189C10.454 29.019 10.7281 29.0192 11.0021 29.0196C11.7799 29.0206 12.5577 29.0211 13.3355 29.021C13.3774 29.021 13.4193 29.021 13.4624 29.021C13.5253 29.021 13.5253 29.021 13.5895 29.021C14.2688 29.0209 14.9481 29.022 15.6275 29.0236C16.3259 29.0252 17.0243 29.026 17.7228 29.0259C18.1145 29.0259 18.5062 29.0262 18.898 29.0274C19.2666 29.0286 19.6352 29.0285 20.0038 29.0277C20.1388 29.0276 20.2738 29.0278 20.4088 29.0285C21.7194 29.0348 21.7194 29.0348 22.2598 28.7734C22.3155 28.7471 22.3711 28.7207 22.4284 28.6935C23.2294 28.2979 23.7744 27.6289 24.0723 26.791C24.1955 26.3472 24.2013 25.9235 24.1992 25.4652C24.1993 25.3828 24.1994 25.3003 24.1995 25.2179C24.1998 24.9923 24.1993 24.7668 24.1987 24.5413C24.1983 24.2977 24.1984 24.0541 24.1985 23.8105C24.1986 23.3889 24.1982 22.9672 24.1976 22.5455C24.1967 21.9358 24.1964 21.3261 24.1962 20.7165C24.196 19.7272 24.1952 18.738 24.1941 17.7488C24.1931 16.788 24.1923 15.8272 24.1918 14.8664C24.1918 14.8066 24.1918 14.7467 24.1917 14.685C24.1915 14.2169 24.1913 13.7488 24.1911 13.2807C24.19 10.9873 24.1877 8.69382 24.1856 6.40039Z"
              fill={props.color}
            />
            <Path
              d="M14.928 -0.19672C14.595 -0.190948 14.2627 -0.193026 13.9297 -0.199477C10.5998 -0.262513 10.5998 -0.262513 9.97088 0.250731C9.77275 0.443231 9.60854 0.651793 9.44845 0.876302C9.1938 1.23121 8.98142 1.51332 8.53844 1.61403C7.73751 1.74199 6.91221 1.69476 6.10528 1.66046C5.71521 1.64588 5.32487 1.64306 4.93458 1.63817C4.34635 1.62954 3.76035 1.60638 3.17188 1.58584C3.17188 2.66994 3.17188 3.75404 3.17188 4.87099C10.6484 4.87099 18.125 4.87099 25.8281 4.87099C25.8281 3.78689 25.8281 2.70279 25.8281 1.58584C25.2414 1.60632 25.2414 1.60632 24.6429 1.62721C24.3917 1.63246 24.1406 1.63723 23.8894 1.64038C23.4925 1.64538 23.096 1.6519 22.6994 1.66876C21.2568 1.81118 21.2568 1.81118 19.954 1.37602C19.7744 1.1889 19.6252 0.979517 19.4749 0.768751C18.5009 -0.56828 16.4077 -0.225387 14.928 -0.19672Z"
              fill={props.color}
            />
          </G>
          {/* <Defs>
              <clipPath id="clip0_196_1254">
                <Rect
                  width="29"
                  height="29"
                  fill="white"
                  transform="matrix(-1 0 0 1 29 0)"
                />
              </clipPath>
            </Defs> */}
        </Svg>
      );

    case CustomIcons.RightArrow:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 13 22"
          fill="none">
          <Path
            d="M2 2L11 11L2 20"
            stroke={props.color}
            strokeWidth={'3.75'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.PasswordKey2:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 47 48"
          fill="none">
          <Path
            d="M24.803 26.287L4 5.5L2.5 4M11.5 13L16.5 8M44 34.25C44 28.0368 38.9633 23 32.75 23C26.5367 23 21.5 28.0368 21.5 34.25C21.5 40.4632 26.5367 45.5 32.75 45.5C38.9633 45.5 44 40.4632 44 34.25Z"
            stroke={props.color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.591 4.59099C14.4697 3.71231 14.4697 2.28769 13.591 1.40901C12.7123 0.53033 11.2877 0.530331 10.409 1.40901L13.591 4.59099ZM7.59099 10.591L13.591 4.59099L10.409 1.40901L4.40901 7.40901L7.59099 10.591Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.HelpCircle:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 24"
          fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM12 7.75C11.3787 7.75 10.875 8.25368 10.875 8.875C10.875 9.28921 10.5392 9.625 10.125 9.625C9.71079 9.625 9.375 9.28921 9.375 8.875C9.375 7.42525 10.5503 6.25 12 6.25C13.4497 6.25 14.625 7.42525 14.625 8.875C14.625 9.58584 14.3415 10.232 13.883 10.704C13.7907 10.7989 13.7027 10.8869 13.6187 10.9708C13.4029 11.1864 13.2138 11.3753 13.0479 11.5885C12.8289 11.8699 12.75 12.0768 12.75 12.25V13C12.75 13.4142 12.4142 13.75 12 13.75C11.5858 13.75 11.25 13.4142 11.25 13V12.25C11.25 11.5948 11.555 11.0644 11.8642 10.6672C12.0929 10.3733 12.3804 10.0863 12.6138 9.85346C12.6842 9.78321 12.7496 9.71789 12.807 9.65877C13.0046 9.45543 13.125 9.18004 13.125 8.875C13.125 8.25368 12.6213 7.75 12 7.75ZM12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Tick:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 31 22"
          fill="none">
          <Path
            d="M2 11L11.0006 20L29 2"
            stroke={props.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.Clock:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 20 20"
          fill="none">
          <Path
            d="M10.0263 5.01779C9.80478 5.01779 9.59234 5.1059 9.4357 5.26274C9.27907 5.41957 9.19107 5.63229 9.19107 5.85409V10.0356C9.19112 10.2574 9.27915 10.47 9.43579 10.6268L11.9415 13.1357C12.099 13.2881 12.31 13.3724 12.529 13.3705C12.748 13.3686 12.9574 13.2806 13.1123 13.1255C13.2672 12.9705 13.355 12.7607 13.3569 12.5415C13.3588 12.3222 13.2746 12.1109 13.1225 11.9532L10.8615 9.68935V5.85409C10.8615 5.63229 10.7735 5.41957 10.6169 5.26274C10.4603 5.1059 10.2478 5.01779 10.0263 5.01779ZM19.892 8.47337C19.6053 6.65513 18.8246 4.95086 17.6355 3.54704C16.4463 2.14323 14.8944 1.09394 13.1497 0.513988C11.4049 -0.0659643 9.5344 -0.15424 7.74287 0.258819C5.95134 0.671878 4.30779 1.57036 2.99203 2.85596V0.836298C2.99203 0.614498 2.90403 0.401782 2.7474 0.244946C2.59076 0.0881097 2.37832 0 2.15681 0C1.93529 0 1.72285 0.0881097 1.56621 0.244946C1.40958 0.401782 1.32158 0.614498 1.32158 0.836298V4.18149C1.32158 4.62509 1.49757 5.05052 1.81084 5.3642C2.12411 5.67787 2.549 5.85409 2.99203 5.85409H6.33293C6.55445 5.85409 6.76689 5.76598 6.92352 5.60914C7.08016 5.4523 7.16816 5.23959 7.16816 5.01779C7.16816 4.79599 7.08016 4.58327 6.92352 4.42644C6.76689 4.2696 6.55445 4.18149 6.33293 4.18149H4.03523C5.36992 2.82471 7.1275 1.96522 9.01677 1.74543C10.906 1.52564 12.8136 1.95875 14.4234 2.97299C16.0332 3.98722 17.2487 5.52172 17.8684 7.32223C18.488 9.12275 18.4748 11.0812 17.8307 12.8731C17.1867 14.6651 15.9506 16.1829 14.3272 17.1752C12.7038 18.1675 10.7905 18.5746 8.9044 18.3292C7.01828 18.0837 5.2725 17.2004 3.95632 15.8257C2.64014 14.4509 1.83256 12.6671 1.66736 10.7698C1.64571 10.566 1.54869 10.3776 1.39537 10.2418C1.24206 10.1059 1.04353 10.0323 0.83882 10.0356C0.72201 10.0359 0.606545 10.0606 0.499784 10.108C0.393022 10.1555 0.297304 10.2247 0.218729 10.3112C0.140154 10.3978 0.080444 10.4998 0.0434041 10.6107C0.00636428 10.7216 -0.00719343 10.839 0.00359486 10.9555C0.135674 12.2881 0.532774 13.5807 1.1715 14.7573C1.81023 15.9338 2.67766 16.9704 3.7227 17.8061C4.76774 18.6418 5.96925 19.2596 7.25643 19.6231C8.54362 19.9867 9.89045 20.0886 11.2176 19.9229C12.5447 19.7571 13.8253 19.3272 14.9839 18.6582C16.1425 17.9893 17.1557 17.095 17.9637 16.0279C18.7718 14.9608 19.3584 13.7426 19.689 12.4451C20.0196 11.1475 20.0875 9.79679 19.8886 8.47254L19.892 8.47337Z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Cancel:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 30 30"
          fill="none">
          <G clip-path="url(#clip0_174_962)">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15 30C12.0333 30 9.13314 29.1203 6.6664 27.4721C4.19967 25.8238 2.27712 23.4812 1.14181 20.7403C0.00649226 17.9994 -0.290548 14.9834 0.28823 12.0736C0.867008 9.16393 2.29559 6.49119 4.39338 4.3934C6.49117 2.29562 9.16395 0.867006 12.0737 0.288228C14.9834 -0.290551 17.9994 0.00649929 20.7403 1.14181C23.4812 2.27713 25.8238 4.19972 27.4721 6.66646C29.1203 9.1332 30 12.0333 30 15C30 18.9783 28.4196 22.7936 25.6066 25.6066C22.7936 28.4197 18.9782 30 15 30ZM15 2.50001C12.5277 2.50001 10.1109 3.23312 8.05534 4.60664C5.99972 5.98015 4.39762 7.93239 3.45153 10.2165C2.50543 12.5005 2.25785 15.0139 2.74016 17.4386C3.22248 19.8634 4.41303 22.0907 6.16119 23.8388C7.90934 25.587 10.1366 26.7775 12.5613 27.2598C14.9861 27.7421 17.4995 27.4946 19.7835 26.5485C22.0676 25.6024 24.0198 24.0002 25.3934 21.9446C26.7669 19.889 27.5 17.4723 27.5 15C27.5 11.6848 26.183 8.50538 23.8388 6.16117C21.4946 3.81697 18.3152 2.50001 15 2.50001ZM20.8825 20.8825C20.7721 20.9929 20.6411 21.0805 20.4968 21.1402C20.3526 21.2 20.198 21.2307 20.0419 21.2307C19.8858 21.2307 19.7312 21.2 19.5869 21.1402C19.4427 21.0805 19.3117 20.9929 19.2013 20.8825L14.9812 16.6625L10.7613 20.8825C10.6523 20.998 10.5213 21.0904 10.376 21.1544C10.2308 21.2183 10.0741 21.2524 9.91538 21.2547C9.75666 21.257 9.59913 21.2274 9.45205 21.1677C9.30497 21.108 9.17134 21.0194 9.05913 20.9071C8.94693 20.7948 8.85842 20.6611 8.79882 20.514C8.73922 20.3669 8.70974 20.2093 8.71215 20.0506C8.71456 19.8919 8.74881 19.7352 8.81286 19.59C8.8769 19.4447 8.96944 19.3138 9.085 19.205L13.305 14.985L9.085 10.765C8.96944 10.6562 8.8769 10.5253 8.81286 10.38C8.74881 10.2348 8.71456 10.0782 8.71215 9.91943C8.70974 9.76071 8.73922 9.60313 8.79882 9.456C8.85842 9.30888 8.94693 9.17522 9.05913 9.06294C9.17134 8.95065 9.30497 8.86202 9.45205 8.80231C9.59913 8.74259 9.75666 8.71301 9.91538 8.7153C10.0741 8.7176 10.2308 8.75172 10.376 8.81565C10.5213 8.87958 10.6523 8.97203 10.7613 9.0875L14.9812 13.3075L19.2013 9.0875C19.311 8.97527 19.4418 8.88592 19.5863 8.82461C19.7307 8.76331 19.8859 8.73128 20.0428 8.73038C20.1997 8.72948 20.3552 8.75972 20.5004 8.81936C20.6456 8.879 20.7775 8.96685 20.8884 9.07782C20.9994 9.18878 21.0873 9.32065 21.1469 9.46581C21.2066 9.61096 21.2368 9.76651 21.2359 9.92344C21.235 10.0804 21.203 10.2355 21.1417 10.38C21.0804 10.5245 20.991 10.6553 20.8787 10.765L16.6588 14.985L20.8787 19.205C21.1014 19.4271 21.2268 19.7285 21.2275 20.043C21.2282 20.3575 21.1041 20.6594 20.8825 20.8825Z"
              fill={props.color}
            />
          </G>
          {/* <Defs>
              <clipPath id="clip0_174_962">
                <Rect width="30" height="30" fill="white" />
              </clipPath>
            </Defs> */}
        </Svg>
      );

    case CustomIcons.Scheduled:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 76 76"
          fill="none">
          <G clip-path="url(#clip0_186_1021)">
            <Path
              d="M22.3486 0.139854C23.1363 0.614833 23.6626 1.20523 24.0099 2.05968C24.1954 2.82043 24.1954 2.82043 24.1954 5.04699C31.641 5.04699 39.0867 5.04699 46.7579 5.04699C46.7579 4.26324 46.7579 3.47949 46.7579 2.67199C46.9802 1.77055 47.3886 1.05238 48.0939 0.445426C49.0556 -0.133813 49.9677 -0.13252 51.0626 0.000113642C51.9103 0.3086 52.4865 0.903993 52.9923 1.63293C53.3121 2.38253 53.3253 3.04207 53.3077 3.84093C53.3064 3.95727 53.305 4.07361 53.3037 4.19347C53.3002 4.478 53.2949 4.7625 53.2892 5.04699C53.4272 5.04567 53.5652 5.04435 53.7075 5.04299C55.0133 5.03092 56.3191 5.02204 57.6249 5.01622C58.2962 5.01314 58.9674 5.00895 59.6386 5.0022C60.2873 4.99571 60.9359 4.99219 61.5847 4.99066C61.8312 4.98956 62.0777 4.98744 62.3242 4.98421C64.3141 4.95924 65.7236 5.18786 67.2121 6.60384C67.9709 7.46885 68.4498 8.5136 68.4471 9.67122C68.4471 9.79361 68.4472 9.916 68.4473 10.0421C68.4466 10.1758 68.446 10.3094 68.4453 10.4471C68.4452 10.5898 68.4451 10.7324 68.445 10.8793C68.4445 11.3585 68.4429 11.8376 68.4414 12.3168C68.4409 12.6598 68.4405 13.0029 68.4401 13.3459C68.4393 14.0854 68.4381 14.8249 68.4367 15.5644C68.4347 16.7339 68.435 17.9034 68.4358 19.073C68.4359 19.1714 68.436 19.2699 68.436 19.3713C68.4364 19.8747 68.4368 20.3781 68.4371 20.8815C68.438 21.9187 68.4387 22.956 68.4392 23.9932C68.4392 24.0973 68.4393 24.2013 68.4393 24.3086C68.44 25.9941 68.4369 27.6797 68.4326 29.3652C68.4282 31.0968 68.4285 32.8284 68.4326 34.5599C68.4348 35.5318 68.4348 36.5035 68.4297 37.4753C68.425 38.3897 68.4258 39.304 68.4308 40.2184C68.4317 40.5537 68.4305 40.889 68.4272 41.2242C68.3265 43.2136 68.3265 43.2136 69.1579 44.9319C69.3573 45.0992 69.5596 45.2631 69.7657 45.422C71.3502 47.4078 72.3383 49.8306 73.0314 52.2501C73.1077 52.513 73.1077 52.513 73.1856 52.7812C74.2955 57.4906 73.3351 62.6452 70.9532 66.797C70.1368 68.0883 69.1891 69.2564 68.1329 70.3595C68.0315 70.4703 67.9301 70.5811 67.8256 70.6952C66.896 71.678 65.8405 72.4346 64.7189 73.1798C64.5803 73.2732 64.4418 73.3666 64.2991 73.4628C60.2243 76.024 54.8184 76.7439 50.1466 75.6891C45.2137 74.436 40.8535 71.484 38.177 67.0997C37.4797 65.9066 36.8842 64.7194 36.5157 63.3829C36.3626 63.3835 36.2094 63.384 36.0516 63.3846C32.3225 63.3978 28.5934 63.4075 24.8642 63.4137C23.0608 63.4168 21.2574 63.4209 19.454 63.4277C17.882 63.4336 16.3099 63.4375 14.7378 63.4388C13.9056 63.4396 13.0735 63.4414 12.2413 63.4457C11.4574 63.4497 10.6735 63.451 9.88963 63.4501C9.60253 63.4502 9.31544 63.4514 9.02835 63.4537C7.01456 63.4689 5.40239 63.3386 3.85948 61.8986C2.61807 60.5417 2.45772 59.2546 2.46599 57.4691C2.46537 57.2604 2.46456 57.0516 2.46357 56.8429C2.46143 56.2713 2.46206 55.6997 2.46315 55.1282C2.46386 54.5109 2.462 53.8937 2.46048 53.2764C2.45793 52.068 2.4578 50.8596 2.45858 49.6511C2.45918 48.6687 2.45896 47.6863 2.45817 46.7039C2.45806 46.564 2.45795 46.4242 2.45783 46.28C2.45761 45.9958 2.45738 45.7116 2.45715 45.4274C2.45511 42.7629 2.45592 40.0985 2.45762 37.434C2.4591 34.9975 2.45718 32.561 2.45362 30.1244C2.45 27.6214 2.44858 25.1184 2.44956 22.6154C2.45008 21.2106 2.44975 19.8059 2.44715 18.4011C2.44497 17.2052 2.44487 16.0093 2.44746 14.8134C2.44872 14.2036 2.44904 13.5937 2.44677 12.9839C2.44471 12.4249 2.44542 11.8661 2.44829 11.3072C2.44911 11.0105 2.44703 10.7139 2.44482 10.4172C2.45891 8.6909 2.88785 7.51976 4.07982 6.26464C5.07551 5.39264 6.16535 5.02344 7.46905 5.03014C7.57915 5.03012 7.68925 5.03009 7.80268 5.03007C8.16652 5.03017 8.53034 5.03133 8.89418 5.03249C9.14647 5.03277 9.39876 5.03298 9.65105 5.03313C10.3151 5.0337 10.9791 5.03515 11.6431 5.0368C12.3206 5.03831 12.9982 5.03899 13.6758 5.03974C15.0052 5.04133 16.3347 5.04387 17.6642 5.04699C17.6573 4.86789 17.6504 4.68879 17.6433 4.50426C17.6377 4.2646 17.6323 4.02494 17.6271 3.78527C17.6221 3.66778 17.6171 3.5503 17.612 3.42925C17.595 2.39424 17.8667 1.62533 18.56 0.84957C18.709 0.727588 18.709 0.727588 18.8609 0.603141C19.0105 0.47714 19.0105 0.47714 19.163 0.348594C19.9957 -0.241313 21.4209 -0.201517 22.3486 0.139854Z"
              fill="#EAF4FB"
            />
            <Path
              d="M22.3485 0.139854C23.1362 0.614833 23.6625 1.20523 24.0098 2.05968C24.1953 2.82043 24.1953 2.82043 24.1953 5.04699C31.6409 5.04699 39.0866 5.04699 46.7578 5.04699C46.7578 4.26324 46.7578 3.47949 46.7578 2.67199C46.9801 1.77055 47.3885 1.05238 48.0938 0.445426C49.0555 -0.133813 49.9676 -0.13252 51.0625 0.000113642C51.9102 0.3086 52.4864 0.903993 52.9922 1.63293C53.312 2.38253 53.3252 3.04207 53.3076 3.84093C53.3063 3.95727 53.3049 4.07361 53.3036 4.19347C53.3001 4.478 53.2948 4.7625 53.2891 5.04699C53.4271 5.04567 53.5651 5.04435 53.7074 5.04299C55.0132 5.03092 56.319 5.02204 57.6248 5.01622C58.2961 5.01314 58.9673 5.00895 59.6385 5.0022C60.2872 4.99571 60.9358 4.99219 61.5846 4.99066C61.8311 4.98956 62.0776 4.98744 62.3241 4.98421C64.314 4.95924 65.7235 5.18786 67.212 6.60384C70.6487 10.5218 68.4297 21.3919 68.4297 22.8595C46.6806 22.8595 24.9316 22.8595 2.52344 22.8595C2.52344 7.90337 2.52344 7.90337 4.07971 6.26464C5.0754 5.39264 6.16525 5.02344 7.46895 5.03014C7.57905 5.03012 7.68915 5.03009 7.80258 5.03007C8.16641 5.03017 8.53024 5.03133 8.89407 5.03249C9.14637 5.03277 9.39866 5.03298 9.65095 5.03313C10.315 5.0337 10.9789 5.03515 11.6429 5.0368C12.3205 5.03831 12.9981 5.03899 13.6757 5.03974C15.0051 5.04133 16.3346 5.04387 17.6641 5.04699C17.6572 4.86789 17.6503 4.68879 17.6432 4.50426C17.6376 4.2646 17.6322 4.02494 17.627 3.78527C17.622 3.66778 17.617 3.5503 17.6119 3.42925C17.5949 2.39424 17.8666 1.62533 18.5599 0.84957C18.7089 0.727588 18.7089 0.727588 18.8608 0.603141C19.0104 0.47714 19.0104 0.47714 19.1629 0.348594C19.9956 -0.241313 21.4207 -0.201517 22.3485 0.139854Z"
              fill="#FE4055"
            />
            <Path
              d="M62.9469 45.8207C63.1946 46.0302 63.4387 46.2439 63.6798 46.4609C63.7508 46.5246 63.8218 46.5883 63.8949 46.6539C66.4214 48.9538 68.2292 52.2429 68.451 55.6968C68.6052 59.545 67.6972 63.1458 65.0992 66.0825C64.8745 66.3215 64.6488 66.5597 64.422 66.7968C64.2854 66.9501 64.2854 66.9501 64.146 67.1065C61.9746 69.4542 58.5153 70.8534 55.3656 70.9937C51.4382 71.0935 47.8773 69.9441 44.943 67.2589C42.1951 64.646 40.5814 61.1154 40.4736 57.3229C40.4224 53.503 41.7618 50.0855 44.42 47.3196C49.3669 42.3095 57.2476 41.4324 62.9469 45.8207Z"
              fill="#EAF4FB"
            />
            <Path
              d="M40.5235 37.9072C40.764 37.9029 40.764 37.9029 41.0094 37.8985C41.7097 37.9028 42.1733 37.9229 42.7842 38.2812C43.1648 38.9491 43.1279 39.5188 43.0933 40.2729C43.0899 40.4111 43.0866 40.5494 43.0831 40.6918C43.0744 41.0317 43.0622 41.3712 43.0469 41.7109C43.1891 41.6175 43.3312 41.5241 43.4777 41.4279C45.8011 39.9242 48.056 38.8881 50.7656 38.2968C50.9212 38.2603 51.0768 38.2237 51.237 38.1861C53.9535 37.6531 56.8671 37.8798 59.5235 38.5937C59.711 38.6423 59.8985 38.6909 60.0917 38.741C62.5501 39.47 64.8596 40.7841 66.7969 42.4531C67.0179 42.6408 67.0179 42.6408 67.2434 42.8323C67.9861 43.4798 67.9861 43.4798 68.2813 43.789C68.2813 43.887 68.2813 43.9849 68.2813 44.0859C68.3632 44.1157 68.4451 44.1456 68.5294 44.1763C69.0126 44.4649 69.3159 44.8709 69.6543 45.3105C69.7261 45.4037 69.7979 45.4968 69.8719 45.5928C73.0532 49.8048 74.0783 55.0782 73.3734 60.2563C72.7256 64.1114 70.8173 67.5554 68.1328 70.3593C67.9807 70.5255 67.9807 70.5255 67.8255 70.695C66.8959 71.6778 65.8404 72.4344 64.7188 73.1796C64.5802 73.273 64.4417 73.3664 64.299 73.4626C60.2242 76.0238 54.8183 76.7437 50.1465 75.689C45.2116 74.4353 40.8518 71.4823 38.1756 67.0956C37.3086 65.6203 36.6608 64.1502 36.2188 62.4921C36.178 62.3588 36.1373 62.2254 36.0953 62.088C35.5608 60.3004 35.4493 58.5296 35.4395 56.6752C35.4381 56.5149 35.4367 56.3545 35.4353 56.1893C35.454 51.3614 37.753 46.9767 40.9688 43.4921C41.1157 43.3942 41.2627 43.2962 41.4141 43.1952C41.1351 43.1895 41.1351 43.1895 40.8505 43.1837C40.6054 43.1753 40.3603 43.1668 40.1153 43.1581C39.9928 43.156 39.8703 43.1539 39.7442 43.1518C38.8314 43.115 38.8314 43.115 38.3688 42.7615C37.8597 42.0489 37.9558 41.3288 37.9444 40.477C37.9388 40.3217 37.9333 40.1664 37.9275 40.0065C37.9197 39.325 37.9284 38.871 38.2633 38.2684C39.0016 37.8545 39.6913 37.8923 40.5235 37.9072ZM43.8447 47.9081C41.315 50.7993 40.3085 54.3345 40.4967 58.1018C40.7628 61.9074 42.7161 65.3457 45.5703 67.8359C48.7595 70.3411 52.4233 71.3277 56.4474 70.9187C59.1095 70.5627 61.6903 69.3289 63.6797 67.539C63.7507 67.4753 63.8217 67.4116 63.8948 67.346C66.6457 64.8417 68.2918 61.4197 68.4807 57.6905C68.595 53.6195 67.1843 50.0938 64.4026 47.1266C61.9373 44.5751 58.4774 43.072 54.9324 43.0034C50.4702 42.9734 46.9211 44.6582 43.8447 47.9081Z"
              fill="#4FABF6"
            />
            <Path
              d="M60.7109 5.04696C61.3232 5.02952 61.9354 5.0191 62.5479 5.00986C62.7195 5.00488 62.8911 4.99991 63.068 4.99478C64.8043 4.97516 65.9517 5.40492 67.212 6.60382C70.6487 10.5218 68.4297 21.3918 68.4297 22.8595C46.6806 22.8595 24.9316 22.8595 2.52344 22.8595C2.52344 20.8021 2.52344 18.7448 2.52344 16.6251C23.0969 16.6251 43.6703 16.6251 64.8672 16.6251C65.3186 10.8961 65.3186 10.8961 63.141 6.40262C62.4256 5.75905 61.6245 5.46947 60.7109 5.1954C60.7109 5.14642 60.7109 5.09743 60.7109 5.04696Z"
              fill="#FE4357"
            />
            <Path
              d="M60.7109 5.04696C61.3232 5.02952 61.9354 5.0191 62.5479 5.00986C62.7195 5.00488 62.8911 4.99991 63.068 4.99478C64.8043 4.97516 65.9517 5.40492 67.212 6.60382C67.9629 7.45985 68.4491 8.50269 68.4475 9.65026C68.4478 9.82571 68.4478 9.82571 68.4482 10.0047C68.4476 10.1317 68.4471 10.2586 68.4465 10.3894C68.4466 10.5241 68.4466 10.6589 68.4466 10.7977C68.4465 11.2426 68.4453 11.6876 68.4442 12.1325C68.4439 12.4412 68.4437 12.7498 68.4435 13.0585C68.443 13.8706 68.4415 14.6828 68.4399 15.4949C68.4384 16.3237 68.4377 17.1525 68.4369 17.9813C68.4353 19.6074 68.4327 21.2334 68.4297 22.8595C67.2541 22.8595 66.0784 22.8595 64.8672 22.8595C64.8672 21.5369 64.8672 20.2143 64.8672 18.8517C44.2937 18.8517 23.7203 18.8517 2.52344 18.8517C2.52344 18.1169 2.52344 17.3821 2.52344 16.6251C23.0969 16.6251 43.6703 16.6251 64.8672 16.6251C65.3186 10.8961 65.3186 10.8961 63.141 6.40262C62.4256 5.75905 61.6245 5.46947 60.7109 5.1954C60.7109 5.14642 60.7109 5.09743 60.7109 5.04696Z"
              fill="#E80054"
            />
            <Path
              d="M2.5235 53.7344C2.57248 53.7344 2.62147 53.7344 2.67194 53.7344C2.70255 53.9242 2.73317 54.114 2.76471 54.3096C3.06739 55.6372 3.76229 56.5993 4.86313 57.3856C5.91879 58.047 6.9155 58.2093 8.14784 58.211C8.26486 58.2117 8.38188 58.2125 8.50244 58.2132C8.89399 58.2155 9.28554 58.2167 9.67709 58.218C9.95799 58.2194 10.2389 58.2209 10.5198 58.2224C11.2821 58.2264 12.0445 58.2296 12.8069 58.2325C13.6036 58.2358 14.4004 58.2398 15.1972 58.2438C16.706 58.2512 18.2147 58.2579 19.7235 58.2643C21.4412 58.2716 23.1589 58.2798 24.8766 58.288C28.4099 58.3049 31.9433 58.3208 35.4766 58.3359C35.5068 58.4871 35.5068 58.4871 35.5375 58.6414C35.564 58.7742 35.5905 58.9071 35.6178 59.0439C35.644 59.1753 35.6702 59.3068 35.6972 59.4422C35.7927 59.9155 35.8938 60.3875 35.9962 60.8594C36.1273 61.4636 36.2536 62.0685 36.3745 62.6748C36.401 62.8077 36.4275 62.9405 36.4548 63.0773C36.4849 63.2286 36.4849 63.2286 36.5157 63.3828C32.6319 63.3967 28.748 63.4072 24.8642 63.4136C23.0608 63.4166 21.2574 63.4208 19.454 63.4276C17.8819 63.4335 16.3098 63.4374 14.7378 63.4387C13.9056 63.4395 13.0734 63.4413 12.2412 63.4456C11.4573 63.4496 10.6735 63.4509 9.88959 63.45C9.60249 63.4501 9.3154 63.4513 9.02831 63.4536C7.01452 63.4688 5.40235 63.3385 3.85944 61.8984C2.83119 60.7746 2.45138 59.6421 2.48001 58.1411C2.48064 58.0143 2.48127 57.8875 2.48192 57.7568C2.48439 57.3561 2.48998 56.9554 2.49567 56.5547C2.4979 56.2812 2.49993 56.0077 2.50175 55.7342C2.50664 55.0676 2.51431 54.401 2.5235 53.7344Z"
              fill="#D2DBFB"
            />
            <Path
              d="M53.1406 38C55.3489 37.9219 57.3826 38.031 59.5234 38.5937C59.7115 38.6423 59.8996 38.6909 60.0934 38.741C62.5511 39.4722 64.8595 40.784 66.7969 42.4531C66.9442 42.5783 67.0915 42.7034 67.2433 42.8323C67.9861 43.4799 67.9861 43.4799 68.2812 43.7891C68.2812 43.887 68.2812 43.985 68.2812 44.0859C68.3631 44.1158 68.445 44.1456 68.5294 44.1764C69.0126 44.465 69.3158 44.8709 69.6543 45.3105C69.7261 45.4037 69.7979 45.4969 69.8719 45.5929C73.0532 49.8049 74.0783 55.0782 73.3734 60.2563C72.7255 64.1115 70.8173 67.5554 68.1328 70.3594C68.0314 70.4702 67.93 70.5809 67.8255 70.6951C66.8959 71.6778 65.8404 72.4345 64.7188 73.1797C64.5802 73.2731 64.4417 73.3664 64.299 73.4626C60.7602 75.687 56.9256 76.1199 52.8438 76C52.8438 75.951 52.8438 75.902 52.8438 75.8516C52.9808 75.8297 53.1178 75.8079 53.2589 75.7855C56.9725 75.1623 60.354 73.8792 63.2344 71.3984C63.3737 71.283 63.513 71.1677 63.6565 71.0488C67.0919 68.0911 69.3983 63.5123 69.7428 59.0002C70.0952 53.3297 68.6151 48.4637 64.8916 44.1538C63.4097 42.488 61.642 41.2489 59.6719 40.2266C59.5217 40.1475 59.3715 40.0685 59.2167 39.9871C57.3417 39.0604 55.2148 38.4244 53.1406 38.1484C53.1406 38.0994 53.1406 38.0505 53.1406 38Z"
              fill="#1987EA"
            />
            <Path
              d="M52.6953 43.0468C56.8065 42.9424 60.5095 43.6087 63.6797 46.4609C63.7507 46.5246 63.8217 46.5883 63.8948 46.6539C66.4213 48.9539 68.2291 52.2429 68.4509 55.6968C68.605 59.545 67.6971 63.1458 65.0991 66.0825C64.8744 66.3216 64.6487 66.5597 64.4219 66.7968C64.3308 66.899 64.2397 67.0012 64.1459 67.1065C62.1531 69.261 58.9923 70.6533 56.1094 70.9531C55.5185 70.9697 54.9284 70.9671 54.3374 70.9624C54.1002 70.9614 54.1002 70.9614 53.8582 70.9603C53.4705 70.9586 53.0829 70.9562 52.6953 70.9531C53.2398 70.6646 53.7519 70.5447 54.356 70.415C56.51 69.9068 58.6676 68.8911 60.2204 67.2775C60.4141 67.0937 60.4141 67.0937 60.7109 67.0937C60.7109 66.9957 60.7109 66.8978 60.7109 66.7968C60.8089 66.7968 60.9069 66.7968 61.0078 66.7968C61.0649 66.6691 61.0649 66.6691 61.1232 66.5388C61.3225 66.1701 61.5574 65.8966 61.8335 65.5815C63.2449 63.8314 64.045 61.8386 64.5703 59.6718C64.6002 59.5568 64.63 59.4418 64.6608 59.3234C65.2274 55.4757 64.2882 51.8118 62.0469 48.6875C61.9447 48.5438 61.8425 48.4001 61.7372 48.252C59.576 45.4199 56.1671 43.7426 52.6953 43.1953C52.6953 43.1463 52.6953 43.0973 52.6953 43.0468Z"
              fill="#D2DBFA"
            />
            <Path
              d="M22.3485 0.139854C23.2484 0.682538 23.8118 1.38918 24.1094 2.39762C24.2073 2.87967 24.2147 3.31709 24.2097 3.80904C24.209 3.90497 24.2082 4.00089 24.2073 4.09972C24.2044 4.4155 24.1998 4.73123 24.1952 5.04699C24.1927 5.26945 24.1903 5.49191 24.1878 5.71438C24.1806 6.29272 24.1694 6.8709 24.1563 7.44913C24.1513 7.68699 24.1471 7.92487 24.1438 8.16276C24.1388 8.51295 24.1311 8.86298 24.1228 9.2131C24.1213 9.37106 24.1213 9.37106 24.1199 9.53221C24.0902 10.5395 23.7056 11.3068 23.0077 12.0236C22.2013 12.6364 21.3591 12.7261 20.3649 12.6938C19.3992 12.538 18.7958 12.0235 18.1928 11.2814C17.66 10.2584 17.6165 9.37777 17.6141 8.24419C17.6131 8.08024 17.6122 7.91628 17.6111 7.74736C17.6096 7.40127 17.6089 7.05518 17.609 6.70908C17.6083 6.18165 17.6029 5.6544 17.5973 5.12701C17.5964 4.78993 17.5959 4.45285 17.5956 4.11578C17.5934 3.95911 17.5913 3.80244 17.5891 3.64102C17.596 2.51385 17.8 1.69984 18.5598 0.84957C18.6591 0.768249 18.7585 0.686927 18.8608 0.603141C18.9605 0.51914 19.0602 0.43514 19.1629 0.348594C19.9956 -0.241313 21.4207 -0.201517 22.3485 0.139854Z"
              fill="#D3DCFA"
            />
            <Path
              d="M51.4353 0.135857C52.1946 0.584189 52.7957 1.19241 53.1572 2.00307C53.3418 2.73196 53.3373 3.43269 53.3389 4.18194C53.3399 4.34189 53.3409 4.50185 53.3419 4.66665C53.3434 5.00451 53.3441 5.34237 53.344 5.68023C53.3447 6.19365 53.3501 6.70688 53.3557 7.22027C53.3566 7.54961 53.3572 7.87896 53.3574 8.20831C53.3596 8.3602 53.3617 8.51208 53.3639 8.66858C53.357 9.7719 53.2027 10.8748 52.4311 11.7188C51.5068 12.5534 50.7554 12.7044 49.512 12.6811C48.6913 12.5819 48.2257 12.3022 47.6484 11.7267C46.7401 10.5116 46.7907 9.14521 46.7856 7.70037C46.7822 7.47694 46.7784 7.25351 46.7743 7.03008C46.7651 6.47871 46.7611 5.92746 46.7593 5.37601C46.7577 5.04258 46.7543 4.7092 46.7505 4.37578C46.7488 4.16254 46.7472 3.94929 46.7456 3.73605C46.7439 3.54742 46.7422 3.35879 46.7405 3.16444C46.7766 2.13607 47.1714 1.44837 47.8276 0.674523C48.8123 -0.172914 50.2278 -0.303572 51.4353 0.135857Z"
              fill="#D3DBF9"
            />
            <Path
              d="M64.8673 22.8594C66.0429 22.8594 67.2185 22.8594 68.4298 22.8594C68.4298 29.8641 68.4298 36.8689 68.4298 44.0859C67.7052 43.4649 66.9965 42.8392 66.296 42.1928C65.9454 41.8664 65.9454 41.8664 65.6451 41.7263C65.3235 41.5524 65.107 41.395 64.8673 41.1172C64.7135 40.5321 64.7359 39.9588 64.7493 39.3569C64.7492 39.1787 64.749 39.0005 64.7488 38.817C64.7494 38.3296 64.7546 37.8425 64.7619 37.3552C64.7684 36.8454 64.769 36.3357 64.7703 35.826C64.7735 34.8613 64.782 33.8967 64.7924 32.932C64.8041 31.8336 64.8098 30.7351 64.815 29.6366C64.8258 27.3775 64.8449 25.1185 64.8673 22.8594Z"
              fill="#D3DCFB"
            />
            <Path
              d="M48.0938 0.445312C49.0134 0.91579 49.3766 1.56349 49.7266 2.52344C49.8229 3.09847 49.8276 3.65767 49.82 4.23975C49.8203 4.39886 49.8207 4.55798 49.821 4.72191C49.8209 5.05623 49.8189 5.39055 49.8152 5.72485C49.8101 6.23305 49.8121 6.74087 49.815 7.24908C49.814 7.57573 49.8126 7.90237 49.8107 8.229C49.8114 8.37903 49.8121 8.52906 49.8129 8.68363C49.7937 9.85935 49.5399 10.8651 48.8453 11.8286C48.5391 12.0234 48.5391 12.0234 48.1773 12.0605C47.5865 11.7724 47.3451 11.2615 47.0547 10.6875C46.8814 10.1674 46.8723 9.68763 46.8593 9.14572C46.8562 9.03667 46.8532 8.92762 46.85 8.81526C46.8436 8.58331 46.8375 8.35135 46.8317 8.11938C46.823 7.77311 46.8133 7.42688 46.8034 7.08064C46.7726 5.96454 46.7503 4.84833 46.7434 3.73181C46.742 3.54377 46.7407 3.35572 46.7393 3.16198C46.7834 1.99951 47.305 1.26222 48.0938 0.445312Z"
              fill="#EAF4FB"
            />
            <Path
              d="M19.4452 0.148438C19.5432 0.197422 19.6412 0.246406 19.7421 0.296875C19.7023 0.376475 19.6625 0.456074 19.6215 0.538086C19.55 0.939631 19.55 0.939631 19.9462 1.34521C20.0748 1.48911 20.2034 1.633 20.3359 1.78125C20.4854 2.22973 20.5057 2.53842 20.5106 3.00771C20.5125 3.16729 20.5144 3.32688 20.5164 3.4913C20.5175 3.66385 20.5185 3.83641 20.5197 4.01419C20.5209 4.19195 20.5221 4.36972 20.5233 4.55287C20.5254 4.92957 20.527 5.30628 20.5281 5.68299C20.5307 6.25736 20.5372 6.8316 20.5437 7.40593C20.5452 7.77209 20.5465 8.13826 20.5475 8.50443C20.5501 8.67548 20.5527 8.84653 20.5554 9.02277C20.5524 10.1384 20.4167 10.9749 19.6699 11.8311C19.4452 12.0234 19.4452 12.0234 19.0927 12.042C18.4046 11.7471 18.0952 11.1452 17.8052 10.4776C17.6071 9.73071 17.6157 9.01382 17.6141 8.24408C17.6131 8.08013 17.6122 7.91617 17.6111 7.74725C17.6096 7.40116 17.6089 7.05506 17.609 6.70897C17.6083 6.18154 17.6029 5.65429 17.5973 5.12689C17.5964 4.78982 17.5959 4.45274 17.5956 4.11566C17.5934 3.95899 17.5913 3.80232 17.5891 3.64091C17.5961 2.50966 17.7963 1.68597 18.5755 0.844238C18.6788 0.761577 18.7821 0.678916 18.8886 0.59375C19.0459 0.465166 19.0459 0.465166 19.2064 0.333984C19.2852 0.272754 19.364 0.211523 19.4452 0.148438Z"
              fill="#EBF2F9"
            />
            <Path
              d="M10.1401 48.0473C10.373 48.0408 10.373 48.0408 10.6106 48.0343C11.7558 48.0248 11.7558 48.0248 12.3452 48.3656C12.9156 49.0406 12.7981 49.8343 12.8027 50.6728C12.8057 50.8132 12.8088 50.9537 12.8119 51.0984C12.8194 52.4277 12.8194 52.4277 12.3202 52.9921C11.6226 53.4204 10.8978 53.3436 10.1029 53.3447C9.95609 53.3483 9.80923 53.3519 9.65793 53.3557C8.57794 53.36 8.57794 53.36 7.99641 53.0072C7.39594 52.3328 7.53175 51.5834 7.52385 50.7192C7.51954 50.5639 7.51524 50.4086 7.5108 50.2486C7.50129 49.0996 7.50129 49.0996 7.85145 48.5141C8.53083 47.9229 9.27669 48.0552 10.1401 48.0473Z"
              fill="#2F468F"
            />
            <Path
              d="M20.2338 48.0473C20.4667 48.0408 20.4667 48.0408 20.7043 48.0342C21.8534 48.0247 21.8534 48.0247 22.4389 48.3749C23.0185 49.041 22.892 49.7426 22.8964 50.5893C22.8994 50.7375 22.9025 50.8857 22.9056 51.0384C22.9131 52.4379 22.9131 52.4379 22.4139 52.9921C21.731 53.4082 21.048 53.338 20.2709 53.3354C20.1311 53.3378 19.9913 53.3402 19.8473 53.3426C18.5284 53.3435 18.5284 53.3435 17.9608 52.8437C17.5324 52.1461 17.6093 51.4212 17.6083 50.6264C17.6046 50.4795 17.601 50.3327 17.5973 50.1814C17.5929 49.1014 17.5929 49.1014 17.9457 48.5198C18.6202 47.9194 19.3696 48.0552 20.2338 48.0473Z"
              fill="#2D458E"
            />
            <Path
              d="M30.3646 48.0288C30.5191 48.0296 30.6737 48.0305 30.8328 48.0314C32.134 48.0523 32.134 48.0523 32.6561 48.3906C33.1161 49.0806 33.0077 49.7869 33.0087 50.5986C33.0123 50.7603 33.0159 50.922 33.0197 51.0885C33.024 52.2748 33.024 52.2748 32.6805 52.8727C32.0084 53.4332 31.2157 53.3322 30.3832 53.3447C30.1744 53.353 30.1744 53.353 29.9614 53.3615C29.3433 53.3693 28.7926 53.3689 28.2587 53.0304C27.7526 52.5206 27.7936 51.8811 27.7916 51.1987C27.7957 51.0313 27.7998 50.8639 27.8041 50.6914C27.8019 50.5239 27.7997 50.3565 27.7974 50.184C27.8045 49.475 27.8269 48.9775 28.1763 48.3529C28.8961 47.9576 29.5577 48.0032 30.3646 48.0288Z"
              fill="#2C448D"
            />
            <Path
              d="M10.0938 37.9167C10.2542 37.9151 10.4145 37.9134 10.5797 37.9118C11.7455 37.9226 11.7455 37.9226 12.3482 38.2837C12.9217 38.945 12.8095 39.6462 12.8214 40.4865C12.8297 40.707 12.8297 40.707 12.8382 40.9318C12.8529 42.1544 12.8529 42.1544 12.5077 42.7003C11.9961 43.2028 11.3485 43.1551 10.6681 43.1543C10.5 43.1496 10.3319 43.1448 10.1588 43.1398C9.99009 43.1408 9.82142 43.1418 9.64763 43.1427C8.40797 43.1267 8.40797 43.1267 7.97224 42.7632C7.40904 42.0746 7.5262 41.3341 7.51471 40.4772C7.50917 40.322 7.50362 40.1667 7.4979 40.0067C7.49009 39.325 7.499 38.871 7.83362 38.2681C8.57214 37.855 9.26214 37.8983 10.0938 37.9167Z"
              fill="#2C448D"
            />
            <Path
              d="M50.7007 27.8226C50.9537 27.8202 50.9537 27.8202 51.2118 27.8177C52.454 27.8287 52.454 27.8287 52.8872 28.1897C53.4273 28.8508 53.3218 29.505 53.3262 30.3275C53.3292 30.4686 53.3323 30.6097 53.3355 30.7551C53.3428 32.0719 53.3428 32.0719 52.8438 32.6561C52.1687 33.1062 51.5042 33.0077 50.71 33.0087C50.5554 33.0123 50.4008 33.0159 50.2415 33.0197C49.1028 33.024 49.1028 33.024 48.5147 32.6712C47.923 31.9939 48.0497 31.2455 48.0381 30.3832C48.0325 30.2279 48.027 30.0726 48.0213 29.9126C48.0135 29.2342 48.024 28.7765 48.3518 28.174C49.1138 27.7524 49.8449 27.8046 50.7007 27.8226Z"
              fill="#2C448D"
            />
            <Path
              d="M20.2432 27.8413C20.4964 27.834 20.4964 27.834 20.7547 27.8265C21.4696 27.8219 21.9686 27.8236 22.6003 28.1747C22.9934 28.8933 22.9616 29.5496 22.943 30.3555C22.9446 30.5087 22.9462 30.662 22.9479 30.8199C22.9413 31.5035 22.9349 31.9379 22.5759 32.531C21.901 33.1265 21.1514 32.9916 20.2896 32.9995C20.1344 33.0038 19.9791 33.0081 19.8191 33.0126C18.6701 33.0221 18.6701 33.0221 18.0845 32.6719C17.5026 32.0031 17.6369 31.2978 17.6363 30.4483C17.6345 30.2988 17.6327 30.1494 17.6308 29.9954C17.6305 29.8513 17.6302 29.7072 17.6299 29.5588C17.6293 29.427 17.6287 29.2952 17.6281 29.1594C17.6673 28.7655 17.7459 28.534 17.961 28.2031C18.666 27.7331 19.414 27.8455 20.2432 27.8413Z"
              fill="#2B438D"
            />
            <Path
              d="M20.3173 37.9536C20.4809 37.9492 20.6445 37.9449 20.8131 37.9405C20.9705 37.9393 21.128 37.938 21.2903 37.9367C21.4345 37.9346 21.5788 37.9324 21.7274 37.9302C22.2258 38.0194 22.3952 38.2073 22.7109 38.5937C22.9966 39.1652 22.8932 39.8669 22.8964 40.4955C22.8995 40.6437 22.9025 40.7919 22.9057 40.9446C22.913 42.3206 22.913 42.3206 22.414 42.8984C21.7871 43.2118 20.9782 43.1006 20.2895 43.1118C20.12 43.1185 19.9506 43.1253 19.776 43.1323C18.6018 43.1481 18.6018 43.1481 18.1259 42.9017C17.6801 42.4597 17.6154 41.9917 17.5706 41.3809C17.57 41.092 17.5734 40.803 17.5805 40.5141C17.5789 40.3686 17.5772 40.2231 17.5756 40.0731C17.5823 39.4083 17.5952 39.003 17.9475 38.4273C18.6342 37.8099 19.4353 37.9612 20.3173 37.9536Z"
              fill="#2B438D"
            />
            <Path
              d="M10.168 27.804C10.3354 27.7999 10.5029 27.7957 10.6754 27.7915C12.0406 27.7955 12.0406 27.7955 12.5059 28.2597C12.9133 28.9035 12.8624 29.628 12.8399 30.3645C12.8404 30.5722 12.8404 30.5722 12.841 30.784C12.8306 31.5192 12.8125 32.0698 12.3203 32.656C11.6453 33.1061 10.9808 33.0076 10.1866 33.0086C10.0319 33.0122 9.87734 33.0158 9.71805 33.0196C8.57938 33.0239 8.57938 33.0239 7.9913 32.6711C7.39961 31.9938 7.52624 31.2454 7.51468 30.3831C7.50913 30.2278 7.50358 30.0725 7.49786 29.9125C7.49009 29.2342 7.5 28.7769 7.82895 28.1751C8.58823 27.7526 9.31358 27.7927 10.168 27.804Z"
              fill="#2C448D"
            />
            <Path
              d="M30.4298 37.9165C30.6703 37.9112 30.6703 37.9112 30.9157 37.9058C31.6058 37.907 32.0784 37.9262 32.6877 38.265C33.0982 39.0026 33.0609 39.6933 33.046 40.5234C33.0489 40.6838 33.0517 40.8441 33.0547 41.0093C33.0504 41.699 33.0266 42.173 32.6877 42.7813C31.9505 43.1921 31.2596 43.1545 30.4298 43.1396C30.1893 43.1439 30.1893 43.1439 29.9439 43.1483C29.2574 43.1441 28.7799 43.1186 28.1719 42.7865C27.7526 42.0257 27.799 41.294 27.8136 40.4399C27.8107 40.2713 27.8078 40.1026 27.8049 39.9288C27.8119 38.7385 27.8119 38.7385 28.1719 38.1867C28.9192 37.894 29.6344 37.9084 30.4298 37.9165Z"
              fill="#2B428C"
            />
            <Path
              d="M30.3463 27.823C30.5984 27.8177 30.5984 27.8177 30.8557 27.8123C31.5647 27.8135 32.0656 27.8265 32.6929 28.1715C33.0959 28.9101 33.0608 29.602 33.046 30.4299C33.0489 30.5903 33.0518 30.7506 33.0547 30.9158C33.0505 31.6055 33.0266 32.0795 32.6877 32.6878C31.9505 33.0986 31.2596 33.061 30.4298 33.0461C30.1893 33.0504 30.1893 33.0504 29.9439 33.0548C29.2572 33.0506 28.7796 33.0249 28.1713 32.693C27.7529 31.9321 27.8049 31.1999 27.8229 30.3464C27.8212 30.1778 27.8196 30.0091 27.8179 29.8353C27.8288 28.6073 27.8288 28.6073 28.1558 28.1559C28.8037 27.6866 29.5739 27.8155 30.3463 27.823Z"
              fill="#2B438C"
            />
            <Path
              d="M40.6069 27.8226C40.8599 27.8202 40.8599 27.8202 41.1181 27.8177C42.346 27.8286 42.346 27.8286 42.7975 28.1555C43.2668 28.8035 43.1378 29.5737 43.1304 30.3461C43.1357 30.5982 43.1357 30.5982 43.1411 30.8554C43.1399 31.5643 43.1265 32.0656 42.7825 32.6932C42.0411 33.0963 41.3441 33.0547 40.5142 33.0365C40.3526 33.0381 40.191 33.0397 40.0245 33.0414C38.8346 33.0304 38.8346 33.0304 38.4039 32.6694C37.8377 31.9819 37.9558 31.2406 37.9443 30.3832C37.9388 30.2279 37.9332 30.0726 37.9275 29.9126C37.9198 29.2342 37.9303 28.7765 38.258 28.174C39.0201 27.7524 39.7511 27.8046 40.6069 27.8226Z"
              fill="#2A428C"
            />
            <Path
              d="M60.7759 27.8228C61.028 27.8175 61.028 27.8175 61.2852 27.8121C61.9972 27.8133 62.4952 27.825 63.123 28.1759C63.5175 28.8936 63.4849 29.5499 63.4663 30.3555C63.4679 30.5088 63.4695 30.6621 63.4712 30.82C63.4646 31.5035 63.4582 31.938 63.0993 32.5311C62.4243 33.1265 61.6748 32.9917 60.813 32.9996C60.6577 33.0039 60.5024 33.0082 60.3424 33.0126C60.117 33.0145 60.117 33.0145 59.887 33.0164C59.7497 33.0186 59.6125 33.0207 59.4711 33.0229C58.9416 32.9289 58.7023 32.7501 58.3359 32.3594C58.2422 31.9472 58.2422 31.9472 58.2426 31.4781C58.2423 31.3086 58.242 31.139 58.2417 30.9644C58.2452 30.7879 58.2488 30.6115 58.2524 30.4297C58.2508 30.2533 58.2492 30.0769 58.2475 29.8951C58.2584 28.6078 58.2584 28.6078 58.5853 28.1534C59.2346 27.6875 60.0041 27.8154 60.7759 27.8228Z"
              fill="#2B438D"
            />
            <Path
              d="M40.5235 37.9071C40.764 37.9028 40.764 37.9028 41.0094 37.8984C41.708 37.9027 42.1713 37.9208 42.7791 38.2811C43.3805 39.316 43.2511 40.7096 43.0469 41.8593C42.8295 42.3792 42.6681 42.5786 42.2033 42.8896C41.1359 43.2304 39.8408 43.2878 38.7423 43.0468C38.3689 42.7646 38.2062 42.5684 38.0001 42.1562C37.9524 41.5975 37.9519 41.0374 37.9444 40.477C37.9389 40.3217 37.9333 40.1664 37.9276 40.0064C37.9198 39.325 37.9285 38.8709 38.2633 38.2684C39.0017 37.8545 39.6913 37.8922 40.5235 37.9071Z"
              fill="#2A428C"
            />
            <Path
              d="M55.7848 54.6994C56.4577 55.1539 56.9072 55.7911 57.0662 56.5903C57.1092 57.4198 56.9148 58.1208 56.4064 58.7815C55.834 59.3248 55.2641 59.5704 54.4767 59.6164C53.6893 59.5704 53.1193 59.3248 52.547 58.7815C52.0386 58.1208 51.8441 57.4198 51.8871 56.5903C52.0461 55.7911 52.4956 55.1539 53.1686 54.6994C53.9909 54.2981 54.9624 54.2981 55.7848 54.6994Z"
              fill="#FDDC42"
            />
            <Path
              d="M54.4765 46.9619C54.5744 46.9599 54.6724 46.958 54.7733 46.9561C55.2601 47.1177 55.3979 47.3601 55.664 47.7968C55.7459 48.3195 55.7331 48.835 55.7219 49.3629C55.7211 49.5135 55.7203 49.664 55.7194 49.819C55.7161 50.2985 55.7086 50.7778 55.7011 51.2573C55.6981 51.5828 55.6954 51.9084 55.6929 52.234C55.6864 53.031 55.6762 53.828 55.664 54.6249C54.8802 54.6249 54.0965 54.6249 53.289 54.6249C53.2743 53.6661 53.2635 52.7073 53.2563 51.7484C53.2534 51.4223 53.2493 51.0962 53.2442 50.7701C53.237 50.301 53.2336 49.8321 53.231 49.3629C53.2279 49.2174 53.2248 49.0719 53.2217 48.922C53.2215 48.2696 53.2254 47.9011 53.5709 47.334C53.9052 47.0345 54.0341 46.9532 54.4765 46.9619Z"
              fill="#425DA3"
            />
            <Path
              d="M56.7031 55.8125C57.3237 55.7978 57.9442 55.787 58.5649 55.7799C58.7759 55.7769 58.9868 55.7729 59.1977 55.7677C59.5017 55.7605 59.8056 55.7572 60.1096 55.7545C60.2923 55.7514 60.475 55.7483 60.6632 55.7451C61.2498 55.8253 61.4919 55.9819 61.8984 56.4063C61.9912 56.9165 61.9912 56.9165 61.8984 57.4453C61.5092 57.9447 61.2951 58.1638 60.6632 58.2718C60.4805 58.2679 60.2979 58.264 60.1096 58.26C60.0119 58.259 59.9141 58.2579 59.8133 58.2568C59.5031 58.2527 59.1934 58.2434 58.8833 58.2339C58.6722 58.2302 58.461 58.2268 58.2498 58.2238C57.7341 58.2156 57.2187 58.2028 56.7031 58.1875C56.7393 58.0509 56.7393 58.0509 56.7761 57.9116C56.8573 57.5695 56.8713 57.2677 56.8701 56.9165C56.8705 56.8031 56.8709 56.6896 56.8713 56.5727C56.8633 56.2296 56.8633 56.2296 56.7031 55.8125Z"
              fill="#435EA3"
            />
            <Path
              d="M45.3106 9.01749C45.4496 9.02017 45.5885 9.02285 45.7316 9.02561C46.0739 9.03259 46.4158 9.04235 46.7579 9.0546C46.8574 9.36987 46.9562 9.68534 47.0548 10.0009C47.1099 10.1765 47.165 10.3522 47.2218 10.5332C47.3517 10.9843 47.3517 10.9843 47.3517 11.2812C46.7982 11.3028 46.2448 11.3159 45.691 11.3275C45.5344 11.3338 45.3778 11.34 45.2164 11.3464C44.0526 11.3647 44.0526 11.3647 43.4621 10.9356C43.1363 10.451 43.0858 10.2207 43.1954 9.64835C43.7132 8.84334 44.4522 8.98623 45.3106 9.01749Z"
              fill="#E80154"
            />
            <Path
              d="M16.2168 9.01751C16.3557 9.02019 16.4946 9.02287 16.6377 9.02563C16.98 9.03262 17.322 9.04237 17.6641 9.05462C17.7389 9.34205 17.813 9.62969 17.8867 9.91742C17.928 10.0776 17.9694 10.2377 18.012 10.4027C18.1094 10.8359 18.1094 10.8359 18.1094 11.2812C17.5528 11.2984 16.9962 11.309 16.4394 11.3183C16.2816 11.3233 16.1237 11.3282 15.9611 11.3334C15.809 11.3353 15.6568 11.3372 15.5001 11.3392C15.3602 11.3423 15.2203 11.3454 15.0761 11.3486C14.5783 11.2605 14.4068 11.0832 14.1016 10.6874C14.022 10.1307 14.0042 9.80269 14.308 9.32135C14.9122 8.90528 15.5024 8.9915 16.2168 9.01751Z"
              fill="#E80154"
            />
            <Path
              d="M24.1953 9.05485C24.6779 9.03883 25.1599 9.02705 25.6426 9.01774C25.7792 9.01277 25.9158 9.00779 26.0566 9.00267C27.069 8.98799 27.069 8.98799 27.5508 9.32679C27.8386 9.77427 27.8538 10.0168 27.7578 10.5392C27.4911 10.9358 27.4911 10.9358 27.0156 11.2814C26.4287 11.373 25.8544 11.3513 25.2622 11.3278C25.023 11.3228 25.023 11.3228 24.7789 11.3177C24.3864 11.3089 23.9939 11.2956 23.6016 11.2814C23.7975 10.5466 23.9934 9.81188 24.1953 9.05485Z"
              fill="#E80054"
            />
            <Path
              d="M53.2891 9.05485C53.7714 9.03758 54.2537 9.02705 54.7363 9.01774C54.8729 9.01277 55.0096 9.00779 55.1503 9.00267C56.1627 8.98799 56.1627 8.98799 56.6446 9.32679C56.9324 9.77427 56.9475 10.0168 56.8516 10.5392C56.5848 10.9358 56.5848 10.9358 56.1094 11.2814C55.5224 11.373 54.9482 11.3513 54.356 11.3278C54.1167 11.3228 54.1167 11.3228 53.8727 11.3177C53.48 11.3089 53.0878 11.2967 52.6953 11.2814C52.7257 11.1953 52.7562 11.1092 52.7875 11.0205C53.013 10.3667 53.2007 9.74408 53.2891 9.05485Z"
              fill="#E80054"
            />
            <Path
              d="M19.3304 48.0794C19.4835 48.0799 19.6365 48.0804 19.7943 48.0809C20.0348 48.0828 20.0348 48.0828 20.2802 48.0847C20.5224 48.0857 20.5224 48.0857 20.7695 48.0867C21.1692 48.0885 21.5689 48.0909 21.9686 48.0939C21.9686 48.1429 21.9686 48.1919 21.9686 48.2424C20.4256 48.3159 20.4256 48.3159 18.8514 48.3908C18.9984 48.5868 19.1454 48.7827 19.2968 48.9846C19.3918 49.547 19.3724 50.1127 19.371 50.6823C19.3752 50.8363 19.3794 50.9902 19.3837 51.1488C19.3866 52.255 19.3866 52.255 19.1263 52.6712C18.921 52.877 18.921 52.877 18.5546 53.1408C18.2025 53 18.0008 52.9074 17.7958 52.5821C17.5474 51.9568 17.6091 51.2912 17.6083 50.6267C17.6046 50.4798 17.601 50.3329 17.5973 50.1816C17.5929 49.1017 17.5929 49.1017 17.9457 48.5201C18.4285 48.0903 18.6965 48.076 19.3304 48.0794Z"
              fill="#425DA2"
            />
            <Path
              d="M9.23679 48.0794C9.38987 48.0799 9.54295 48.0804 9.70066 48.0809C9.94118 48.0828 9.94118 48.0828 10.1866 48.0847C10.4288 48.0857 10.4288 48.0857 10.6759 48.0867C11.0756 48.0884 11.4753 48.0909 11.875 48.0939C11.875 48.1429 11.875 48.1919 11.875 48.2424C10.332 48.3159 10.332 48.3159 8.75785 48.3908C8.9048 48.5868 9.05176 48.7827 9.20316 48.9846C9.26078 49.34 9.26078 49.34 9.26231 49.7308C9.26288 49.8729 9.26345 50.015 9.26405 50.1613C9.26232 50.3088 9.2606 50.4562 9.25883 50.6081C9.26055 50.755 9.26227 50.9018 9.26405 51.0531C9.25849 52.4295 9.25849 52.4295 8.75785 52.9924C8.53742 53.0659 8.53742 53.0659 8.31254 53.1408C7.84891 52.8058 7.60926 52.6016 7.49954 52.0293C7.47572 51.5814 7.4765 51.14 7.48685 50.6916C7.48523 50.5383 7.4836 50.3851 7.48193 50.2272C7.48854 49.5436 7.49494 49.1092 7.85389 48.5161C8.33623 48.0905 8.6056 48.076 9.23679 48.0794Z"
              fill="#3F5AA0"
            />
            <Path
              d="M48.836 27.9062C49.3053 28.1096 49.4287 28.2015 49.7267 28.6484C49.7954 29.2059 49.7816 29.7664 49.7823 30.3276C49.786 30.481 49.7896 30.6344 49.7933 30.7924C49.7969 31.7086 49.7423 32.2534 49.1329 32.9531C48.6483 32.6853 48.4072 32.5325 48.0939 32.0625C48.0215 31.5021 48.032 30.9386 48.0289 30.374C48.0216 30.1421 48.0216 30.1421 48.0141 29.9055C48.0063 28.7894 48.0063 28.7894 48.2637 28.3752C48.469 28.1695 48.469 28.1695 48.836 27.9062Z"
              fill="#405BA1"
            />
            <Path
              d="M30.4018 48.0474C30.6411 48.0525 30.6411 48.0525 30.8851 48.0576C31.2778 48.0663 31.67 48.0785 32.0625 48.0938C32.0625 48.1428 32.0625 48.1918 32.0625 48.2423C30.5195 48.3157 30.5195 48.3157 28.9453 48.3907C29.0922 48.5376 29.2392 48.6846 29.3906 48.836C29.4862 49.4189 29.4594 50.0088 29.4556 50.5987C29.4585 50.7604 29.4615 50.9221 29.4645 51.0887C29.4638 52.2809 29.4638 52.2809 29.0897 52.8821C28.993 52.9674 28.8964 53.0528 28.7969 53.1407C28.4305 52.9697 28.196 52.8367 27.9062 52.5469C27.8302 51.9408 27.8444 51.3297 27.8413 50.7193C27.834 50.4651 27.834 50.4651 27.8265 50.2059C27.8219 49.4897 27.8247 48.9851 28.1718 48.3501C28.9041 47.9563 29.5853 48.015 30.4018 48.0474Z"
              fill="#3D59A0"
            />
            <Path
              d="M18.5546 38C18.6036 38.098 18.6526 38.1959 18.7031 38.2969C18.801 38.2969 18.899 38.2969 19 38.2969C19.4271 39.0264 19.3515 39.7645 19.3525 40.5884C19.3561 40.7423 19.3598 40.8963 19.3635 41.0549C19.3679 42.1915 19.3679 42.1915 18.9965 42.7831C18.8512 42.9136 18.8512 42.9136 18.7031 43.0469C18.1989 42.8382 17.952 42.6194 17.664 42.1562C17.5732 41.6183 17.5952 41.0775 17.5991 40.5327C17.5961 40.3859 17.5931 40.239 17.5901 40.0877C17.5905 39.4172 17.5925 39.0082 17.9464 38.4262C18.2578 38.1484 18.2578 38.1484 18.5546 38Z"
              fill="#425DA3"
            />
            <Path
              d="M8.60939 38C9.31082 38.7762 9.29806 39.5102 9.28664 40.5234C9.29018 40.6677 9.29372 40.812 9.29737 40.9606C9.29594 41.6594 9.28478 42.1523 8.82683 42.7036C8.70609 42.8169 8.58535 42.9302 8.46095 43.0469C8.11024 42.9066 7.90757 42.8137 7.7025 42.4902C7.44641 41.8431 7.50922 41.1458 7.50539 40.4585C7.50051 40.3046 7.49563 40.1506 7.4906 39.992C7.48168 38.7284 7.48168 38.7284 7.92693 38.2638C8.31252 38 8.31252 38 8.60939 38Z"
              fill="#3F5BA1"
            />
            <Path
              d="M18.4062 27.9062C19.1298 28.3145 19.1298 28.3145 19.2968 28.6484C19.3366 29.1794 19.3312 29.7118 19.3339 30.2441C19.337 30.3911 19.34 30.538 19.3432 30.6895C19.3475 31.5032 19.3262 32.1087 18.8515 32.8047C18.7045 32.8782 18.7045 32.8782 18.5546 32.9531C17.831 32.3965 17.831 32.3965 17.664 32.0625C17.6282 31.5252 17.6365 30.9866 17.6362 30.4482C17.6343 30.2988 17.6325 30.1494 17.6306 29.9954C17.6304 29.8513 17.6301 29.7072 17.6298 29.5588C17.6292 29.427 17.6286 29.2952 17.6279 29.1593C17.6671 28.7655 17.7458 28.534 17.9609 28.2031C18.1078 28.1052 18.2548 28.0072 18.4062 27.9062Z"
              fill="#425DA3"
            />
            <Path
              d="M8.3126 27.9062C8.66491 28.0472 8.86638 28.1396 9.07139 28.4653C9.31896 29.088 9.25803 29.7493 9.25889 30.4111C9.26253 30.5567 9.26616 30.7024 9.26991 30.8524C9.27354 31.7499 9.19968 32.2649 8.60948 32.9531C8.12489 32.6853 7.88372 32.5325 7.57041 32.0625C7.49804 31.5021 7.50859 30.9386 7.50547 30.374C7.49815 30.1421 7.49815 30.1421 7.49069 29.9055C7.48284 28.7894 7.48284 28.7894 7.74023 28.3752C7.94557 28.1695 7.94557 28.1695 8.3126 27.9062Z"
              fill="#3F5AA1"
            />
            <Path
              d="M28.6483 38C29.1231 38.3376 29.3525 38.5429 29.4637 39.1255C29.4906 39.5934 29.4917 40.0548 29.4833 40.5234C29.4862 40.6838 29.489 40.8441 29.492 41.0093C29.4839 42.3151 29.4839 42.3151 29.0136 42.7871C28.8931 42.8728 28.7725 42.9586 28.6483 43.0469C28.1602 42.7067 27.9421 42.5009 27.833 41.9051C27.8061 41.4148 27.805 40.9309 27.8134 40.4399C27.8105 40.2713 27.8076 40.1026 27.8047 39.9288C27.812 38.6968 27.812 38.6968 28.2831 38.1815C28.4036 38.1216 28.5241 38.0617 28.6483 38Z"
              fill="#3D58A0"
            />
            <Path
              d="M28.5 27.9062C28.9692 28.1096 29.0927 28.2015 29.3906 28.6484C29.429 29.019 29.429 29.019 29.43 29.4556C29.4304 29.6129 29.4308 29.7701 29.4312 29.9322C29.4301 30.0964 29.4289 30.2605 29.4277 30.4297C29.4289 30.5939 29.43 30.758 29.4312 30.9272C29.4308 31.0845 29.4304 31.2418 29.43 31.4038C29.4297 31.5479 29.4294 31.692 29.429 31.8404C29.3906 32.2109 29.3906 32.2109 29.0937 32.6562C28.9958 32.6562 28.8978 32.6562 28.7969 32.6562C28.7479 32.7542 28.6989 32.8522 28.6484 32.9531C28.2996 32.7104 28.1233 32.5685 27.9062 32.2109C27.7959 31.5884 27.8095 30.9768 27.8227 30.3462C27.8211 30.1775 27.8195 30.0088 27.8178 29.8351C27.8288 28.5896 27.8288 28.5896 28.2084 28.1504C28.3046 28.0698 28.4008 27.9893 28.5 27.9062Z"
              fill="#3D59A0"
            />
            <Path
              d="M58.9297 27.9062C59.3989 28.1096 59.5223 28.2015 59.8203 28.6484C59.8852 29.2091 59.8684 29.7729 59.8667 30.3369C59.8691 30.4915 59.8715 30.6461 59.8739 30.8054C59.8748 32.2331 59.8748 32.2331 59.375 32.8047C59.228 32.8782 59.228 32.8782 59.0781 32.9531C58.3633 32.48 58.3633 32.48 58.2422 31.9471C58.2424 31.7923 58.2425 31.6375 58.2426 31.478C58.2423 31.3085 58.242 31.139 58.2417 30.9643C58.2452 30.7879 58.2488 30.6115 58.2524 30.4297C58.2508 30.2533 58.2492 30.0768 58.2475 29.8951C58.2585 28.5901 58.2585 28.5901 58.6381 28.148C58.7343 28.0682 58.8305 27.9885 58.9297 27.9062Z"
              fill="#3C58A0"
            />
            <Path
              d="M38.7423 27.9062C39.1087 28.0877 39.1087 28.0877 39.4845 28.5C39.5939 29.1157 39.5743 29.7226 39.5587 30.3462C39.5591 30.5143 39.5595 30.6824 39.5598 30.8556C39.5498 31.7047 39.5318 32.2375 39.0392 32.9531C38.3483 32.7349 38.3483 32.7349 38.1276 32.3964C37.8796 31.7469 37.939 31.052 37.9352 30.3647C37.9303 30.2108 37.9254 30.0569 37.9204 29.8983C37.9125 28.789 37.9125 28.789 38.1699 28.3758C38.3752 28.1701 38.3752 28.1701 38.7423 27.9062Z"
              fill="#3D59A0"
            />
            <Path
              d="M39.0391 38C39.725 38.7002 39.5606 39.6049 39.5586 40.5234C39.5628 40.6999 39.567 40.8763 39.5713 41.058C39.5717 41.2276 39.5721 41.3971 39.5725 41.5718C39.5736 41.7266 39.5746 41.8814 39.5757 42.0409C39.454 42.5902 39.2007 42.7436 38.7422 43.0469C38.0078 42.3362 37.9699 41.9548 37.9507 40.9528C37.9486 40.7958 37.9465 40.6388 37.9443 40.4771C37.9388 40.3218 37.9332 40.1665 37.9275 40.0065C37.9128 38.7246 37.9128 38.7246 38.356 38.2627C38.7422 38 38.7422 38 39.0391 38Z"
              fill="#3D59A0"
            />
          </G>
          {/* <Defs>
              <clipPath id="clip0_186_1021">
                <Rect width="76" height="76" fill="white" />
              </clipPath>
            </Defs> */}
        </Svg>
      );

    case CustomIcons.Completed:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 60 60"
          fill="none">
          <Path
            d="M30 55C43.75 55 55 43.75 55 30C55 16.25 43.75 5 30 5C16.25 5 5 16.25 5 30C5 43.75 16.25 55 30 55Z"
            stroke={props.color}
            strokeWidth="3.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M19.375 30.0002L26.45 37.0752L40.625 22.9253"
            stroke={props.color}
            strokeWidth="3.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case CustomIcons.PlayCircle:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 24"
          fill="none">
          <Mask id="path-1-inside-1_142_397" fill={props.color}>
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8 7V17.2857L17 12.1429L8 7Z"
            />
          </Mask>
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8 7V17.2857L17 12.1429L8 7Z"
            fill={props.color}
          />
          <Path
            d="M8 7L11.721 0.488177L0.5 -5.92385L0.5 7H8ZM8 17.2857H0.5V30.2096L11.721 23.7975L8 17.2857ZM17 12.1429L20.721 18.6547L32.1167 12.1429L20.721 5.63103L17 12.1429ZM0.5 7V17.2857H15.5V7H0.5ZM11.721 23.7975L20.721 18.6547L13.279 5.63103L4.27896 10.7739L11.721 23.7975ZM20.721 5.63103L11.721 0.488177L4.27896 13.5118L13.279 18.6547L20.721 5.63103Z"
            fill={props.color}
            mask="url(#path-1-inside-1_142_397)"
          />
          <Circle cx="12" cy="12" r="11" stroke={props.color} strokeWidth="2" />
        </Svg>
      );

    case CustomIcons.PauseCircle:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 24"
          fill="none">
          <Circle cx="12" cy="12" r="11" stroke={props.color} strokeWidth="2" />
          <Rect x="7" y="7" width="10" height="10" fill={props.color} />
        </Svg>
      );

    case CustomIcons.AccountBox:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 24"
          fill="none">
          <Path
            d="M0 22.8C0 23.1183 0.158036 23.4235 0.43934 23.6485C0.720645 23.8736 1.10218 24 1.5 24H22.5C22.8978 24 23.2794 23.8736 23.5607 23.6485C23.842 23.4235 24 23.1183 24 22.8V1.2C24 0.88174 23.842 0.576515 23.5607 0.351472C23.2794 0.126428 22.8978 0 22.5 0H1.5C1.10218 0 0.720645 0.126428 0.43934 0.351472C0.158036 0.576515 0 0.88174 0 1.2V22.8ZM12 6.6C12.5933 6.6 13.1734 6.74076 13.6667 7.00447C14.1601 7.26819 14.5446 7.64302 14.7716 8.08156C14.9987 8.5201 15.0581 9.00266 14.9424 9.46822C14.8266 9.93377 14.5409 10.3614 14.1213 10.6971C13.7018 11.0327 13.1672 11.2613 12.5853 11.3539C12.0033 11.4465 11.4001 11.399 10.8519 11.2173C10.3038 11.0357 9.83524 10.728 9.50559 10.3334C9.17595 9.93869 9 9.47468 9 9C9 8.36348 9.31607 7.75303 9.87868 7.30294C10.4413 6.85286 11.2044 6.6 12 6.6ZM6.3165 17.058C6.71862 16.1072 7.4832 15.2812 8.5027 14.6961C9.5222 14.111 10.7453 13.7964 12 13.7964C13.2547 13.7964 14.4778 14.111 15.4973 14.6961C16.5168 15.2812 17.2814 16.1072 17.6835 17.058C17.7524 17.2372 17.7675 17.4269 17.7276 17.6116C17.6876 17.7963 17.5938 17.9709 17.4536 18.1212C17.3134 18.2714 17.1309 18.3931 16.9209 18.4763C16.7109 18.5595 16.4793 18.6019 16.245 18.6H7.77C7.53515 18.602 7.303 18.5598 7.09225 18.4769C6.88149 18.3939 6.69803 18.2726 6.55662 18.1226C6.41521 17.9726 6.31981 17.7981 6.27811 17.6132C6.2364 17.4283 6.24955 17.2381 6.3165 17.058Z"
            fill={props.color}
          />
        </Svg>
      );
    case CustomIcons.Location:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 384 512"
          fill="none">
          <Path
            d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"
            fill={props.color}
          />
        </Svg>
      );

    case CustomIcons.Refresh:
      return (
        <Svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 24"
          fill="none">
          <Path
            d="M1 4V10H7"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M23 20V14H17"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M20.49 9C19.2214 5.33147 15.6837 2.5 11.5 2.5C6.80546 2.5 2.5 6.80546 2.5 11.5C2.5 16.1945 6.80546 20.5 11.5 20.5C15.6837 20.5 19.2214 17.6685 20.49 14"
            stroke={props.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    default:
      return <AppView></AppView>;
  }
};
