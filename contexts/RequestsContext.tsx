import React, { createContext, useContext, useState, ReactNode } from 'react';

type ViewMode = 'request' | 'view';

// Media item with base64 for upload
export interface MediaItem {
  uri: string;
  base64: string;
  mimeType: string;
}

interface RequestsContextType {
  activeMode: ViewMode;
  setActiveMode: (mode: ViewMode) => void;
  
  // Form state
  progress: number;
  setProgress: (progress: number) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  vehicle: string;
  setVehicle: (vehicle: string) => void;
  serviceDescription: string;
  setServiceDescription: (description: string) => void;
  location: string;
  setLocation: (location: string) => void;
  media: MediaItem[];
  setMedia: (media: MediaItem[]) => void;
  
  // Reset function
  resetForm: () => void;
}

const RequestsContext = createContext<RequestsContextType | undefined>(undefined);

export const RequestsProvider = ({ children }: { children: ReactNode }) => {
  const [activeMode, setActiveMode] = useState<ViewMode>('request');
  
  // Form state - start with empty/default values
  const [progress, setProgress] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [vehicle, setVehicle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [location, setLocation] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  
  const resetForm = () => {
    setProgress(0);
    setSelectedCategories([]);
    setVehicle('');
    setServiceDescription('');
    setLocation('');
    setMedia([]);
  };
  
  return (
    <RequestsContext.Provider
      value={{
        activeMode,
        setActiveMode,
        progress,
        setProgress,
        selectedCategories,
        setSelectedCategories,
        vehicle,
        setVehicle,
        serviceDescription,
        setServiceDescription,
        location,
        setLocation,
        media,
        setMedia,
        resetForm,
      }}
    >
      {children}
    </RequestsContext.Provider>
  );
};

export const useRequestsContext = () => {
  const context = useContext(RequestsContext);
  if (!context) {
    throw new Error('useRequestsContext must be used within a RequestsProvider');
  }
  return context;
};

