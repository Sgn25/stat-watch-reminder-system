import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useStatutoryParameters } from '@/hooks/useStatutoryParameters';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, AlertTriangle } from 'lucide-react';

const CalendarPage = () => {
  const { parameters } = useStatutoryParameters();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Get parameters expiring on specific dates
  const getParametersForDate = (date: Date) => {
    return parameters.filter(param => {
      const expiryDate = new Date(param.expiry_date);
      return expiryDate.toDateString() === date.toDateString();
    });
  };

  // Get all expiry dates for highlighting
  const expiryDates = parameters.map(param => new Date(param.expiry_date));

  const isExpiryDate = (date: Date) => {
    return expiryDates.some(expiryDate => 
      expiryDate.toDateString() === date.toDateString()
    );
  };

  const hoveredDateParameters = hoveredDate ? getParametersForDate(hoveredDate) : [];

  // Utility for DD/MM/YYYY
  function toDisplayDate(isoDate: string) {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }

  // Utility for DD MMM YYYY
  function toDisplayDateLong(date: Date) {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Calendar</h1>
            <p className="text-gray-400 mt-1">Track license and permit expiration dates</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-400" />
                    Expiration Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border border-gray-600 bg-gray-900 text-white"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center text-white",
                        caption_label: "text-sm font-medium text-white",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white border border-gray-600 hover:bg-gray-700",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm p-0 relative",
                        day: "h-9 w-9 p-0 font-normal text-white hover:bg-gray-700 rounded-md",
                        day_selected: "bg-blue-600 text-white hover:bg-blue-600",
                        day_today: "bg-gray-700 text-white",
                        day_outside: "text-gray-600 opacity-50",
                        day_disabled: "text-gray-600 opacity-50",
                        day_hidden: "invisible",
                      }}
                      modifiers={{
                        expiry: expiryDates,
                      }}
                      modifiersClassNames={{
                        expiry: "bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50 ring-2 ring-red-400",
                      }}
                      onDayMouseEnter={(date) => setHoveredDate(date)}
                      onDayMouseLeave={() => setHoveredDate(null)}
                    />
                    
                    {/* Hover Popup */}
                    {hoveredDate && hoveredDateParameters.length > 0 && (
                      <div className="absolute top-4 right-4 bg-gray-700 border border-gray-600 rounded-lg p-3 shadow-xl z-50 min-w-[250px] animate-fade-in">
                        <h4 className="font-semibold text-white mb-2">
                          Expiring on {hoveredDate.toLocaleDateString()}
                        </h4>
                        <div className="space-y-2">
                          {hoveredDateParameters.map((param) => (
                            <div key={param.id} className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-white">{param.name}</p>
                                <p className="text-xs text-gray-400">{param.category}</p>
                              </div>
                              <Badge className="bg-red-600 text-white">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Expires
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Upcoming Expirations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {parameters
                      .filter(param => param.status === 'warning' || param.status === 'expired')
                      .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
                      .slice(0, 5)
                      .map((param) => (
                        <div key={param.id} className="flex items-center justify-between p-2 bg-gray-700 rounded-md">
                          <div>
                            <p className="text-sm font-medium text-white">{param.name}</p>
                            <p className="text-xs text-gray-400">
                              {toDisplayDate(param.expiry_date)}
                            </p>
                          </div>
                          <Badge className={param.status === 'expired' ? 'bg-red-600' : 'bg-amber-600'}>
                            {param.daysUntilExpiry > 0 
                              ? `${param.daysUntilExpiry}d`
                              : `${Math.abs(param.daysUntilExpiry)}d ago`
                            }
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {selectedDate && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">
                      {toDisplayDateLong(selectedDate)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getParametersForDate(selectedDate).length > 0 ? (
                      <div className="space-y-2">
                        {getParametersForDate(selectedDate).map((param) => (
                          <div key={param.id} className="p-2 bg-red-900/50 border border-red-700 rounded-md">
                            <p className="text-sm font-medium text-white">{param.name}</p>
                            <p className="text-xs text-gray-400">{param.category}</p>
                            <Badge className="bg-red-600 text-white mt-1">
                              Expires Today
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No expirations on this date</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default CalendarPage;
