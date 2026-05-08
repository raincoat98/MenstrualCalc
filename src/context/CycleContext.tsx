import React, {createContext, useContext, useState} from 'react';

interface CycleData {
  lastPeriod: Date;
  cycleLength: number;
  periodLength: number;
  hasData: boolean;
}

interface CycleContextType {
  cycleData: CycleData;
  updateCycleData: (data: Partial<CycleData>) => void;
}

const defaultData: CycleData = {
  lastPeriod: new Date(),
  cycleLength: 28,
  periodLength: 5,
  hasData: false,
};

const CycleContext = createContext<CycleContextType>({
  cycleData: defaultData,
  updateCycleData: () => {},
});

export function CycleProvider({children}: {children: React.ReactNode}) {
  const [cycleData, setCycleData] = useState<CycleData>(defaultData);

  const updateCycleData = (data: Partial<CycleData>) => {
    setCycleData(prev => ({...prev, ...data}));
  };

  return (
    <CycleContext.Provider value={{cycleData, updateCycleData}}>
      {children}
    </CycleContext.Provider>
  );
}

export const useCycle = () => useContext(CycleContext);
