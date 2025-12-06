import type { Schema } from '@/amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

// Generate the Amplify Data client
const client = generateClient<Schema>();

interface EventContextType {
  eventName: string;
  setEventName: (name: string) => void;
  recordedDays: Set<string>;
  toggleDay: (dateKey: string) => void;
  isRecorded: (dateKey: string) => boolean;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  isLoading: boolean;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const [eventName, setEventNameState] = useState('Swimming');
  const [recordedDays, setRecordedDays] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get auth state
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Store the tracker ID for updates
  const trackerIdRef = useRef<string | null>(null);

  // Load data from Amplify only when authenticated
  useEffect(() => {
    // Don't load if auth is still loading or user is not authenticated
    if (authLoading || !isAuthenticated) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    async function loadData() {
      try {
        setIsLoading(true);
        // Try to get existing tracker
        const { data: trackers, errors } = await client.models.EventTracker.list();
        
        if (errors) {
          console.error('Failed to load trackers:', errors);
          return;
        }

        if (trackers && trackers.length > 0) {
          // Use the first tracker found
          const tracker = trackers[0];
          trackerIdRef.current = tracker.id;
          setEventNameState(tracker.eventName);
          if (tracker.recordedDays) {
            setRecordedDays(new Set(tracker.recordedDays.filter((d): d is string => d !== null)));
          }
        } else {
          // Create a new tracker if none exists
          const { data: newTracker, errors: createErrors } = await client.models.EventTracker.create({
            eventName: 'Swimming',
            recordedDays: [],
          });
          
          if (createErrors) {
            console.error('Failed to create tracker:', createErrors);
            return;
          }
          
          if (newTracker) {
            trackerIdRef.current = newTracker.id;
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoaded(true);
        setIsLoading(false);
      }
    }
    loadData();
  }, [isAuthenticated, authLoading]);

  // Reset data when user logs out
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      setEventNameState('Swimming');
      setRecordedDays(new Set());
      trackerIdRef.current = null;
    }
  }, [isAuthenticated, authLoading]);

  // Save event name when it changes
  const setEventName = async (name: string) => {
    setEventNameState(name);
    
    if (!trackerIdRef.current) return;
    
    try {
      await client.models.EventTracker.update({
        id: trackerIdRef.current,
        eventName: name,
      });
    } catch (error) {
      console.error('Failed to save event name:', error);
    }
  };

  // Toggle a day's recorded status
  const toggleDay = async (dateKey: string) => {
    const newRecordedDays = new Set(recordedDays);
    if (newRecordedDays.has(dateKey)) {
      newRecordedDays.delete(dateKey);
    } else {
      newRecordedDays.add(dateKey);
    }
    setRecordedDays(newRecordedDays);
    
    if (!trackerIdRef.current) return;
    
    try {
      await client.models.EventTracker.update({
        id: trackerIdRef.current,
        recordedDays: [...newRecordedDays],
      });
    } catch (error) {
      console.error('Failed to save recorded days:', error);
    }
  };

  const isRecorded = (dateKey: string) => recordedDays.has(dateKey);

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <EventContext.Provider
      value={{
        eventName,
        setEventName,
        recordedDays,
        toggleDay,
        isRecorded,
        selectedDate,
        setSelectedDate,
        isLoading,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}

// Helper function to create a date key (YYYY-MM-DD format)
export function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

