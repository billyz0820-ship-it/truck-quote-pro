import { useState, useCallback } from "react";

interface ZipCodeInfo {
  city: string;
  state: string;
  stateCode: string;
}

// US ZIP code to city/state mapping API
export const useZipCodeLookup = () => {
  const [loading, setLoading] = useState(false);

  const lookupZipCode = useCallback(async (zipCode: string): Promise<ZipCodeInfo | null> => {
    if (!zipCode || zipCode.length < 5) return null;
    
    // Only take first 5 digits
    const zip = zipCode.substring(0, 5);
    
    setLoading(true);
    try {
      // Use Zippopotam.us API for ZIP code lookup
      const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      if (data.places && data.places.length > 0) {
        const place = data.places[0];
        return {
          city: place["place name"],
          state: place["state"],
          stateCode: place["state abbreviation"]
        };
      }
      
      return null;
    } catch (error) {
      console.error("ZIP code lookup failed:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookupZipCode, loading };
};
