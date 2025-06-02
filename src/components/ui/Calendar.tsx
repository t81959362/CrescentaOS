import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<any[]>([]); // Add state for holidays

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        // Using the gov.uk API for UK bank holidays
        const response = await fetch('https://www.gov.uk/bank-holidays.json');
        const data = await response.json();
        // The API returns holidays for different regions, we'll use England and Wales for this example
        // You might want to make this configurable or use geolocation
        const currentYear = currentDate.getFullYear();
        const yearEvents = data['england-and-wales'].events.filter((event: any) => 
          new Date(event.date).getFullYear() === currentYear
        );
        setHolidays(yearEvents);
      } catch (error) {
        console.error('Error fetching holidays:', error);
        // Handle error appropriately in a real application
      }
    };

    fetchHolidays();
  }, [currentDate.getFullYear()]); // Re-fetch holidays when the year changes

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };
  
  // Helper function to check if a date is a holiday
  const isHoliday = (day: number, month: number, year: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.some(holiday => holiday.date === dateStr);
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  
  return (
    <motion.div
      className="w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded"
        >
          ←
        </button>
        <h3 className="text-lg font-semibold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded"
        >
          →
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-xs font-medium text-slate-500">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {blanks.map(blank => (
          <div key={`blank-${blank}`} className="h-8" />
        ))}
        {days.map(day => {
          const isCurrentDay = day === new Date().getDate() &&
                               currentDate.getMonth() === new Date().getMonth() &&
                               currentDate.getFullYear() === new Date().getFullYear();
          const holiday = isHoliday(day, currentDate.getMonth(), currentDate.getFullYear());

          let dayClasses = "h-8 text-sm flex items-center justify-center relative"; // Base classes

          if (isCurrentDay) {
            dayClasses += " border border-blue-400/60 dark:border-blue-500/60 text-slate-900 dark:text-white rounded-md shadow-lg"; // Removed background color
          } else if (holiday) {
            dayClasses += " bg-purple-300 dark:bg-purple-700 text-slate-800 dark:text-slate-100 font-semibold rounded-full";
          } else {
            dayClasses += " hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-full";
          }

          return (
            <button
              key={day}
              className={dayClasses}
              title={holiday ? holidays.find(h => h.date === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)?.title : undefined}
            >
              {day}
              {holiday && (
                <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-slate-700 dark:bg-slate-200 rounded-full"></span> // Adjusted dot color and size
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Calendar;