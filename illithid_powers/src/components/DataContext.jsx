import { createContext, useState, useEffect } from "react";
import { mindData } from "../assets/data";

export const DataContext = createContext();

export function DataProvider({ children }) {
  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem("psionicData");
    return savedData ? JSON.parse(savedData) : mindData;
  });

  useEffect(() => {
    data && localStorage.setItem("psionicData", JSON.stringify(data));
  }, [data]);

  const [vials, setVials] = useState(data.resources.vials);

  function saveVials(newVials) {
    setData((prev) => ({
      ...prev,
      resources: {
        vials: newVials,
      },
    }));
  }

  function increase(amount) {
    setVials((prev) => {
      return prev + amount;
    });
    saveVials(vials + amount);
  }

  function decrease(amount) {
    setVials((prev) => {
      if (prev >= 0 && prev >= amount) {
        return prev - amount;
      }
      return 0;
    });
    saveVials(vials - amount);
  }

  function unlockPower(powerKey) {
    setData((prev) => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        [powerKey]: {
          ...prev.abilities[powerKey],
          cntrl: {
            ...prev.abilities[powerKey].cntrl,
            unlocked: true,
          },
        },
      },
    }));
  }
  return (
    <DataContext.Provider
      value={{
        data,
        vials,
        unlockPower,
        saveVials,
        increase,
        decrease,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
