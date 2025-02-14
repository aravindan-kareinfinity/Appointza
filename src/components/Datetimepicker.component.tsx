import React, { forwardRef } from "react";
import { View, Button, Platform, Text } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

type DatePickerComponentProps = {
  date: Date;
  show: boolean;
  mode: "date" | "time" | "datetime"; // Restrict mode to valid values
  setShow: (value: boolean) => void;
  setDate: (date: Date) => void;
};

export const DatePickerComponent = forwardRef<any, DatePickerComponentProps>(
  ({ date, show, setShow, setDate, mode }, ref) => {
    // Function to handle date change
    const onChange = (event: any, selectedDate?: Date) => {
      setShow(false); // Hide picker after selection (Android)
      if (selectedDate) {
        setDate(selectedDate);
      }
    };

    // Show `00:00` if no time is set
    const formattedTime = date
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) 
      : "00:00";

    return (
      <View>
        {show && (
          <DateTimePicker
            value={date ?? new Date(1970, 0, 1, 0, 0, 0)} // Default to 00:00 if date is null
            mode={mode} 
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onChange}
          />
        )}
      </View>
    );
  }
);
