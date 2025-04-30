import React, { forwardRef } from "react";
import { View, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

type DatePickerComponentProps = {
  date: Date;
  show: boolean;
  mode: "date" | "time" | "datetime";
  setShow: (value: boolean) => void;
  setDate: (date: Date) => void;
  daysBefore?: number; // Number of days before current date to allow selection
  disablePrevious?: boolean; // New prop to control previous date allowance
};

export const DatePickerComponent = forwardRef<any, DatePickerComponentProps>(
  ({ date, show, setShow, setDate, mode, daysBefore, disablePrevious = false }, ref) => {
    const currentDate = new Date();
    
    // Calculate minimum date (today if disablePrevious is true, otherwise undefined)
    const minDate = disablePrevious ? new Date(currentDate) : undefined;
    if (minDate) {
      minDate.setHours(0, 0, 0, 0); // Start of day
    }
    
    // Calculate maximum date (today + daysBefore)
    const maxDate = daysBefore !== undefined 
      ? new Date(currentDate.getTime() + daysBefore * 24 * 60 * 60 * 1000)
      : undefined;

    const onChange = (event: any, selectedDate?: Date) => {
      setShow(false);
      if (selectedDate) {
        // Ensure selected date is within allowed range
        if (disablePrevious && selectedDate < minDate!) {
          setDate(minDate!);
        } else if (maxDate && selectedDate > maxDate) {
          setDate(maxDate);
        } else {
          setDate(selectedDate);
        }
      }
    };

    return (
      <View>
        {show && (
          <DateTimePicker
            value={date ?? new Date()}
            mode={mode}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onChange}
            minimumDate={disablePrevious ? minDate : undefined}
            maximumDate={maxDate}
          />
        )}
      </View>
    );
  }
);