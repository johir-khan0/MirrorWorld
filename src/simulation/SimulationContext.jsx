import React, { createContext, useContext, useState, useEffect } from 'react';
import { SimulationEngine } from './engine.js';
import { loadCityScenario } from './scenarios.js';

const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
    // Singleton Engine
    const [engine] = useState(() => new SimulationEngine());

    useEffect(() => {
        // Initialize with default scenario
        loadCityScenario(engine);
        engine.start();

        return () => engine.stop();
    }, [engine]);

    return (
        <SimulationContext.Provider value={engine}>
            {children}
        </SimulationContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSimulation() {
    const context = useContext(SimulationContext);
    if (!context) {
        throw new Error('useSimulation must be used within a SimulationProvider');
    }
    return context;
}
