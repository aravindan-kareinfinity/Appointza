import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DefaultColor } from '../styles/default-color.style';

export enum LucideIcons {
  Home,
  Calendar,
  BarChart2,
  Settings,
  MapPin,
  Clock,
  Users,
  User,
  CreditCard,
  Wallet,
  DollarSign,
  LogOut,
  Menu,
  Plus,
  Edit,
  Trash,
  ChevronRight,
  ChevronLeft,
  Search,
  Bell,
  Heart,
  Star,
  Phone,
  Mail,
  Link,
  Share,
  Send,
  Save,
  Upload,
  Download,
  Camera,
  Image,
  File,
  Folder,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Info,
  HelpCircle,
}

type IconProps = {
  size: number;
  color: string;
  name: LucideIcons;
  stroke?: number;
};

export const LucideIcon = (props: IconProps) => {
  const [stroke, setStroke] = React.useState(2);
  React.useEffect(() => {
    if (props.stroke) {
      setStroke(props.stroke);
    }
  }, [props]);

  switch (props.name) {
    case LucideIcons.Home:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M9 22V12h6v10" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Calendar:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M8 2v4m8-4v4m-11 3h18M5 8h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.BarChart2:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M18 20V10m-6 10V4M6 20v-6" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Settings:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.MapPin:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Clock:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M12 6v6l4 2" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Users:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={props.color} strokeWidth={stroke} />
          <Path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={props.color} strokeWidth={stroke} />
          <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.User:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={props.color} strokeWidth={stroke} />
          <Path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.CreditCard:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M3 10h18" stroke={props.color} strokeWidth={stroke} />
          <Path d="M7 15h.01" stroke={props.color} strokeWidth={stroke} />
          <Path d="M11 15h2" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Wallet:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" stroke={props.color} strokeWidth={stroke} />
          <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" stroke={props.color} strokeWidth={stroke} />
          <Path d="M18 12a2 2 0 0 0 0 4h4v-4z" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.DollarSign:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 1v22" stroke={props.color} strokeWidth={stroke} />
          <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.LogOut:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={props.color} strokeWidth={stroke} />
          <Path d="M16 17l5-5-5-5" stroke={props.color} strokeWidth={stroke} />
          <Path d="M21 12H9" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Menu:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 12h18" stroke={props.color} strokeWidth={stroke} />
          <Path d="M3 6h18" stroke={props.color} strokeWidth={stroke} />
          <Path d="M3 18h18" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Plus:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14" stroke={props.color} strokeWidth={stroke} />
          <Path d="M5 12h14" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Edit:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={props.color} strokeWidth={stroke} />
          <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Trash:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 6h18" stroke={props.color} strokeWidth={stroke} />
          <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={props.color} strokeWidth={stroke} />
          <Path d="M10 11v6" stroke={props.color} strokeWidth={stroke} />
          <Path d="M14 11v6" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.ChevronRight:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="m9 18 6-6-6-6" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.ChevronLeft:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="m15 18-6-6 6-6" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Search:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" stroke={props.color} strokeWidth={stroke} />
          <Path d="m21 21-4.35-4.35" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Bell:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={props.color} strokeWidth={stroke} />
          <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Heart:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Star:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Phone:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Mail:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={props.color} strokeWidth={stroke} />
          <Path d="m22 6-10 7L2 6" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Link:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke={props.color} strokeWidth={stroke} />
          <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Share:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke={props.color} strokeWidth={stroke} />
          <Path d="m16 6-4-4-4 4" stroke={props.color} strokeWidth={stroke} />
          <Path d="M12 2v13" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Send:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="m22 2-7 20-4-9-9-4Z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M22 2 11 13" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Save:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M17 21v-8H7v8" stroke={props.color} strokeWidth={stroke} />
          <Path d="M7 3v5h8" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Upload:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={props.color} strokeWidth={stroke} />
          <Path d="m17 8-5-5-5 5" stroke={props.color} strokeWidth={stroke} />
          <Path d="M12 3v12" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Download:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={props.color} strokeWidth={stroke} />
          <Path d="m7 10 5 5 5-5" stroke={props.color} strokeWidth={stroke} />
          <Path d="M12 15V3" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Camera:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Image:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" stroke={props.color} strokeWidth={stroke} />
          <Path d="m8.5 10.5 2-2 4 4" stroke={props.color} strokeWidth={stroke} />
          <Path d="m14 12.5 2-2 2.5 2.5" stroke={props.color} strokeWidth={stroke} />
          <Path d="M3 18l4-4 4 4 4-4 4 4" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.File:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M14 2v6h6" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Folder:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2z" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Lock:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Unlock:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 11h14v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M12 15v2" stroke={props.color} strokeWidth={stroke} />
          <Path d="M12 7V5a2 2 0 0 1 2-2 2 2 0 0 1 2 2v2" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Eye:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.EyeOff:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke={props.color} strokeWidth={stroke} />
          <Path d="M1 1l22 22" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Check:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M20 6 9 17l-5-5" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.X:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M18 6 6 18" stroke={props.color} strokeWidth={stroke} />
          <Path d="m6 6 12 12" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.AlertCircle:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M12 8v4" stroke={props.color} strokeWidth={stroke} />
          <Path d="M12 16h.01" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.Info:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M12 16v-4" stroke={props.color} strokeWidth={stroke} />
          <Path d="M12 8h.01" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    case LucideIcons.HelpCircle:
      return (
        <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke={props.color} strokeWidth={stroke} />
          <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke={props.color} strokeWidth={stroke} />
          <Path d="M12 17h.01" stroke={props.color} strokeWidth={stroke} />
        </Svg>
      );
    
    default:
      return null;
  }
};

interface IconItemProps {
  name: string;
  icon: React.ReactNode;
}

const IconItem = ({ name, icon }: IconItemProps) => {
  return (
    <View style={styles.iconItem}>
      {icon}
      <Text style={styles.iconName}>{name}</Text>
    </View>
  );
};

export default function IconLibrary() {
  const iconSize = 24;
  const colors = DefaultColor.instance;
  const iconColor = colors.tint_1;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Navigation Icons</Text>
      <View style={styles.iconGrid}>
        <IconItem name="Home" icon={<LucideIcon name={LucideIcons.Home} size={iconSize} color={iconColor} />} />
        <IconItem name="Calendar" icon={<LucideIcon name={LucideIcons.Calendar} size={iconSize} color={iconColor} />} />
        <IconItem name="Dashboard" icon={<LucideIcon name={LucideIcons.BarChart2} size={iconSize} color={iconColor} />} />
        <IconItem name="Settings" icon={<LucideIcon name={LucideIcons.Settings} size={iconSize} color={iconColor} />} />
        <IconItem name="Menu" icon={<LucideIcon name={LucideIcons.Menu} size={iconSize} color={iconColor} />} />
      </View>

      <Text style={styles.sectionTitle}>Business Icons</Text>
      <View style={styles.iconGrid}>
        <IconItem name="Locations" icon={<LucideIcon name={LucideIcons.MapPin} size={iconSize} color={iconColor} />} />
        <IconItem name="Services" icon={<LucideIcon name={LucideIcons.Settings} size={iconSize} color={iconColor} />} />
        <IconItem name="Timing" icon={<LucideIcon name={LucideIcons.Clock} size={iconSize} color={iconColor} />} />
        <IconItem name="Staff" icon={<LucideIcon name={LucideIcons.Users} size={iconSize} color={iconColor} />} />
        <IconItem name="Profile" icon={<LucideIcon name={LucideIcons.User} size={iconSize} color={iconColor} />} />
      </View>

      <Text style={styles.sectionTitle}>Payment Icons</Text>
      <View style={styles.iconGrid}>
        <IconItem name="Card" icon={<LucideIcon name={LucideIcons.CreditCard} size={iconSize} color={iconColor} />} />
        <IconItem name="UPI" icon={<LucideIcon name={LucideIcons.Wallet} size={iconSize} color={iconColor} />} />
        <IconItem name="Cash" icon={<LucideIcon name={LucideIcons.DollarSign} size={iconSize} color={iconColor} />} />
        <IconItem name="Payment" icon={<LucideIcon name={LucideIcons.CreditCard} size={iconSize} color={iconColor} />} />
      </View>

      <Text style={styles.sectionTitle}>Action Icons</Text>
      <View style={styles.iconGrid}>
        <IconItem name="Add" icon={<LucideIcon name={LucideIcons.Plus} size={iconSize} color={iconColor} />} />
        <IconItem name="Edit" icon={<LucideIcon name={LucideIcons.Edit} size={iconSize} color={iconColor} />} />
        <IconItem name="Delete" icon={<LucideIcon name={LucideIcons.Trash} size={iconSize} color={iconColor} />} />
        <IconItem name="Next" icon={<LucideIcon name={LucideIcons.ChevronRight} size={iconSize} color={iconColor} />} />
        <IconItem name="Back" icon={<LucideIcon name={LucideIcons.ChevronLeft} size={iconSize} color={iconColor} />} />
        <IconItem name="Search" icon={<LucideIcon name={LucideIcons.Search} size={iconSize} color={iconColor} />} />
        <IconItem name="Logout" icon={<LucideIcon name={LucideIcons.LogOut} size={iconSize} color={iconColor} />} />
      </View>

      <Text style={styles.sectionTitle}>Notification Icons</Text>
      <View style={styles.iconGrid}>
        <IconItem name="Bell" icon={<LucideIcon name={LucideIcons.Bell} size={iconSize} color={iconColor} />} />
        <IconItem name="Favorite" icon={<LucideIcon name={LucideIcons.Heart} size={iconSize} color={iconColor} />} />
        <IconItem name="Rating" icon={<LucideIcon name={LucideIcons.Star} size={iconSize} color={iconColor} />} />
        <IconItem name="Info" icon={<LucideIcon name={LucideIcons.Info} size={iconSize} color={iconColor} />} />
        <IconItem name="Alert" icon={<LucideIcon name={LucideIcons.AlertCircle} size={iconSize} color={iconColor} />} />
        <IconItem name="Help" icon={<LucideIcon name={LucideIcons.HelpCircle} size={iconSize} color={iconColor} />} />
      </View>

      <Text style={styles.sectionTitle}>Contact Icons</Text>
      <View style={styles.iconGrid}>
        <IconItem name="Phone" icon={<LucideIcon name={LucideIcons.Phone} size={iconSize} color={iconColor} />} />
        <IconItem name="Email" icon={<LucideIcon name={LucideIcons.Mail} size={iconSize} color={iconColor} />} />
        <IconItem name="Link" icon={<LucideIcon name={LucideIcons.Link} size={iconSize} color={iconColor} />} />
        <IconItem name="Share" icon={<LucideIcon name={LucideIcons.Share} size={iconSize} color={iconColor} />} />
        <IconItem name="Send" icon={<LucideIcon name={LucideIcons.Send} size={iconSize} color={iconColor} />} />
      </View>

      <Text style={styles.sectionTitle}>File Icons</Text>
      <View style={styles.iconGrid}>
        <IconItem name="Save" icon={<LucideIcon name={LucideIcons.Save} size={iconSize} color={iconColor} />} />
        <IconItem name="Upload" icon={<LucideIcon name={LucideIcons.Upload} size={iconSize} color={iconColor} />} />
        <IconItem name="Download" icon={<LucideIcon name={LucideIcons.Download} size={iconSize} color={iconColor} />} />
        <IconItem name="Camera" icon={<LucideIcon name={LucideIcons.Camera} size={iconSize} color={iconColor} />} />
        <IconItem name="Image" icon={<LucideIcon name={LucideIcons.Image} size={iconSize} color={iconColor} />} />
        <IconItem name="File" icon={<LucideIcon name={LucideIcons.File} size={iconSize} color={iconColor} />} />
        <IconItem name="Folder" icon={<LucideIcon name={LucideIcons.Folder} size={iconSize} color={iconColor} />} />
      </View>

      <Text style={styles.sectionTitle}>Security Icons</Text>
      <View style={styles.iconGrid}>
        <IconItem name="Lock" icon={<LucideIcon name={LucideIcons.Lock} size={iconSize} color={iconColor} />} />
        <IconItem name="Unlock" icon={<LucideIcon name={LucideIcons.Unlock} size={iconSize} color={iconColor} />} />
        <IconItem name="Show" icon={<LucideIcon name={LucideIcons.Eye} size={iconSize} color={iconColor} />} />
        <IconItem name="Hide" icon={<LucideIcon name={LucideIcons.EyeOff} size={iconSize} color={iconColor} />} />
      </View>

      <Text style={styles.sectionTitle}>Status Icons</Text>
      <View style={styles.iconGrid}>
        <IconItem name="Success" icon={<LucideIcon name={LucideIcons.Check} size={iconSize} color={colors.success} />} />
        <IconItem name="Error" icon={<LucideIcon name={LucideIcons.X} size={iconSize} color={colors.danger} />} />
        <IconItem name="Warning" icon={<LucideIcon name={LucideIcons.AlertCircle} size={iconSize} color={colors.warn} />} />
        <IconItem name="Info" icon={<LucideIcon name={LucideIcons.Info} size={iconSize} color={colors.tint_1} />} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DefaultColor.instance.tint_6,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    color: DefaultColor.instance.tint_3,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  iconItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconName: {
    marginTop: 4,
    fontSize: 12,
    color: DefaultColor.instance.tint_4,
    textAlign: 'center',
  },
});