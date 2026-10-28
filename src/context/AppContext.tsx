import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Factory,
  AssessmentRecord,
  Officer,
  User,
  ComplianceStatus,
  OwnerSignature,
  AssessmentResult,
} from '../types';
import {
  INITIAL_FACTORIES,
  INITIAL_ASSESSMENTS,
  CURRENT_USER,
  AVAILABLE_OFFICERS,
  createChecklistATemplate,
  createChecklistBTemplate,
} from '../data/mockData';

interface AppContextType {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
  factories: Factory[];
  assessments: AssessmentRecord[];
  availableOfficers: Officer[];
  addFactory: (newFac: Omit<Factory, 'id' | 'assessmentHistory'>) => Factory;
  updateFactory: (id: string, updates: Partial<Factory>) => void;
  createAssessmentAssignment: (params: {
    factoryId: string;
    scheduledDate: string;
    scheduledTime: string;
    inspectionType: AssessmentRecord['inspectionType'];
    priority: AssessmentRecord['priority'];
    leadOfficerId: string;
    officerIds: string[];
    specialInstructions?: string;
  }) => AssessmentRecord;
  updateAssessment: (id: string, updates: Partial<AssessmentRecord>) => void;
  updateChecklistItem: (
    assessmentId: string,
    group: 'A' | 'B',
    partNumber: number,
    itemId: string,
    status: ComplianceStatus,
    notes?: string
  ) => void;
  addOfficerToAssessment: (assessmentId: string, officer: Officer) => boolean;
  removeOfficerFromAssessment: (assessmentId: string, officerId: string) => boolean;
  saveOfficerSignature: (assessmentId: string, officerId: string, signatureDataUrl: string) => void;
  saveOwnerSignature: (assessmentId: string, signature: OwnerSignature) => void;
  finalizeAssessment: (assessmentId: string) => AssessmentRecord | null;
  getAssessmentById: (id: string) => AssessmentRecord | undefined;
  getFactoryById: (id: string) => Factory | undefined;
  resetToSampleData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const FACTORIES_STORAGE_KEY = 'factory_assess_factories_v2';
const ASSESSMENTS_STORAGE_KEY = 'factory_assess_records_v2';
const USER_STORAGE_KEY = 'factory_assess_user_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : CURRENT_USER;
    } catch {
      return CURRENT_USER;
    }
  });

  const [factories, setFactories] = useState<Factory[]>(() => {
    try {
      const stored = localStorage.getItem(FACTORIES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_FACTORIES;
    } catch {
      return INITIAL_FACTORIES;
    }
  });

  const [assessments, setAssessments] = useState<AssessmentRecord[]>(() => {
    try {
      const stored = localStorage.getItem(ASSESSMENTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_ASSESSMENTS;
    } catch {
      return INITIAL_ASSESSMENTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FACTORIES_STORAGE_KEY, JSON.stringify(factories));
    } catch (e) {
      console.error('Failed to save factories', e);
    }
  }, [factories]);

  useEffect(() => {
    try {
      localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(assessments));
    } catch (e) {
      console.error('Failed to save assessments', e);
    }
  }, [assessments]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save user session', e);
    }
  }, [currentUser]);

  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addFactory = (newFac: Omit<Factory, 'id' | 'assessmentHistory'>): Factory => {
    const id = `fac_${Date.now()}`;
    const factory: Factory = {
      ...newFac,
      id,
      assessmentHistory: [],
    };
    setFactories((prev) => [factory, ...prev]);
    return factory;
  };

  const updateFactory = (id: string, updates: Partial<Factory>) => {
    setFactories((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const getAssessmentById = (id: string) => assessments.find((a) => a.id === id);
  const getFactoryById = (id: string) => factories.find((f) => f.id === id);

  const createAssessmentAssignment = (params: {
    factoryId: string;
    scheduledDate: string;
    scheduledTime: string;
    inspectionType: AssessmentRecord['inspectionType'];
    priority: AssessmentRecord['priority'];
    leadOfficerId: string;
    officerIds: string[];
    specialInstructions?: string;
  }): AssessmentRecord => {
    const targetFactory = factories.find((f) => f.id === params.factoryId);
    const assignedOfficersList = AVAILABLE_OFFICERS.filter((o) =>
      params.officerIds.includes(o.id)
    ).slice(0, 6);

    // If lead officer wasn't included, prepend
    const lead = AVAILABLE_OFFICERS.find((o) => o.id === params.leadOfficerId);
    if (lead && !assignedOfficersList.some((o) => o.id === lead.id)) {
      assignedOfficersList.unshift(lead);
      if (assignedOfficersList.length > 6) {
        assignedOfficersList.pop();
      }
    }

    const newRecord: AssessmentRecord = {
      id: `rec_${Date.now()}`,
      factoryId: params.factoryId,
      factoryName: targetFactory ? targetFactory.name : 'Unknown Factory',
      scheduledDate: params.scheduledDate,
      scheduledTime: params.scheduledTime || '09:00 AM',
      status: 'scheduled',
      inspectionType: params.inspectionType,
      priority: params.priority,
      leadOfficerId: params.leadOfficerId,
      officers: assignedOfficersList,
      checklistA: createChecklistATemplate(),
      checklistB: createChecklistBTemplate(),
      scorePercent: 0,
      totalPoints: 0,
      maxPoints: 80,
      result: 'PENDING',
      findingsCount: { pass: 0, partial: 0, fail: 0, na: 0 },
      specialInstructions: params.specialInstructions,
      createdAt: new Date().toISOString(),
    };

    setAssessments((prev) => [newRecord, ...prev]);

    // Update factory status if not under review
    if (targetFactory && targetFactory.status === 'Active') {
      updateFactory(params.factoryId, { status: 'Under Review' });
    }

    return newRecord;
  };

  const updateAssessment = (id: string, updates: Partial<AssessmentRecord>) => {
    setAssessments((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, ...updates } : rec))
    );
  };

  const updateChecklistItem = (
    assessmentId: string,
    group: 'A' | 'B',
    partNumber: number,
    itemId: string,
    status: ComplianceStatus,
    notes?: string
  ) => {
    setAssessments((prev) =>
      prev.map((rec) => {
        if (rec.id !== assessmentId) return rec;

        const updatePartList = (parts: typeof rec.checklistA) =>
          parts.map((p) => {
            if (p.partNumber !== partNumber) return p;
            return {
              ...p,
              items: p.items.map((item) => {
                if (item.id !== itemId) return item;
                return {
                  ...item,
                  status,
                  notes: notes !== undefined ? notes : item.notes,
                };
              }),
            };
          });

        const newA = group === 'A' ? updatePartList(rec.checklistA) : rec.checklistA;
        const newB = group === 'B' ? updatePartList(rec.checklistB) : rec.checklistB;

        // Recalculate real-time running score
        const allItems = [
          ...newA.flatMap((p) => p.items),
          ...newB.flatMap((p) => p.items),
        ];

        let earned = 0;
        let scorableCount = 0;
        let passC = 0;
        let partC = 0;
        let failC = 0;
        let naC = 0;
        let hasCriticalFail = false;

        allItems.forEach((it) => {
          if (it.status === 'pass') {
            earned += 2;
            scorableCount += 1;
            passC += 1;
          } else if (it.status === 'partial') {
            earned += 1;
            scorableCount += 1;
            partC += 1;
          } else if (it.status === 'fail') {
            earned += 0;
            scorableCount += 1;
            failC += 1;
            if (it.isCritical) hasCriticalFail = true;
          } else if (it.status === 'na') {
            naC += 1;
          }
        });

        const maxPointsPossible = Math.max(scorableCount * 2, 1);
        const scorePct = Math.round((earned / maxPointsPossible) * 100);

        // Result calculation: pass if >= 75% AND no critical failures
        const newResult: AssessmentResult =
          allItems.some((it) => it.status === null)
            ? 'PENDING'
            : scorePct >= 75 && !hasCriticalFail
            ? 'PASS'
            : 'FAIL';

        return {
          ...rec,
          status: rec.status === 'scheduled' ? 'in_progress' : rec.status,
          checklistA: newA,
          checklistB: newB,
          totalPoints: earned,
          maxPoints: maxPointsPossible,
          scorePercent: scorePct,
          result: newResult,
          findingsCount: {
            pass: passC,
            partial: partC,
            fail: failC,
            na: naC,
          },
          startedAt: rec.startedAt || new Date().toISOString(),
        };
      })
    );
  };

  const addOfficerToAssessment = (assessmentId: string, officer: Officer): boolean => {
    let success = false;
    setAssessments((prev) =>
      prev.map((rec) => {
        if (rec.id !== assessmentId) return rec;
        if (rec.officers.length >= 6) return rec; // max 6 persons
        if (rec.officers.some((o) => o.id === officer.id)) return rec;
        success = true;
        return {
          ...rec,
          officers: [...rec.officers, officer],
        };
      })
    );
    return success;
  };

  const removeOfficerFromAssessment = (assessmentId: string, officerId: string): boolean => {
    let removed = false;
    setAssessments((prev) =>
      prev.map((rec) => {
        if (rec.id !== assessmentId) return rec;
        if (rec.officers.length <= 1) return rec; // keep at least 1 officer
        removed = true;
        return {
          ...rec,
          officers: rec.officers.filter((o) => o.id !== officerId),
        };
      })
    );
    return removed;
  };

  const saveOfficerSignature = (
    assessmentId: string,
    officerId: string,
    signatureDataUrl: string
  ) => {
    const timestamp = new Date().toISOString();
    setAssessments((prev) =>
      prev.map((rec) => {
        if (rec.id !== assessmentId) return rec;
        return {
          ...rec,
          officers: rec.officers.map((off) =>
            off.id === officerId
              ? { ...off, signatureDataUrl, signedAt: timestamp }
              : off
          ),
        };
      })
    );
  };

  const saveOwnerSignature = (assessmentId: string, signature: OwnerSignature) => {
    setAssessments((prev) =>
      prev.map((rec) => {
        if (rec.id !== assessmentId) return rec;
        return {
          ...rec,
          ownerSignature: signature,
        };
      })
    );
  };

  const finalizeAssessment = (assessmentId: string): AssessmentRecord | null => {
    let updatedRec: AssessmentRecord | null = null;
    const certNum = `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    setAssessments((prev) =>
      prev.map((rec) => {
        if (rec.id !== assessmentId) return rec;

        const allItems = [
          ...rec.checklistA.flatMap((p) => p.items),
          ...rec.checklistB.flatMap((p) => p.items),
        ];

        let earned = 0;
        let scorableCount = 0;
        let passC = 0;
        let partC = 0;
        let failC = 0;
        let naC = 0;
        let hasCriticalFail = false;

        allItems.forEach((it) => {
          if (it.status === 'pass') {
            earned += 2;
            scorableCount += 1;
            passC += 1;
          } else if (it.status === 'partial') {
            earned += 1;
            scorableCount += 1;
            partC += 1;
          } else if (it.status === 'fail') {
            scorableCount += 1;
            failC += 1;
            if (it.isCritical) hasCriticalFail = true;
          } else if (it.status === 'na') {
            naC += 1;
          }
        });

        const maxPoints = Math.max(scorableCount * 2, 1);
        const scorePercent = Math.round((earned / maxPoints) * 100);
        const isPass = scorePercent >= 75 && !hasCriticalFail;
        const result: AssessmentResult = isPass ? 'PASS' : 'FAIL';

        updatedRec = {
          ...rec,
          status: 'completed',
          result,
          scorePercent,
          totalPoints: earned,
          maxPoints,
          completedAt: new Date().toISOString(),
          certificateNumber: isPass ? certNum : undefined,
          findingsCount: { pass: passC, partial: partC, fail: failC, na: naC },
        };

        // Also update factory's history
        const leadOff = rec.officers[0]?.name || 'Field Inspector';
        const historyEntry = {
          id: `hist_${Date.now()}`,
          assessmentId: rec.id,
          date: new Date().toISOString().split('T')[0],
          type: rec.inspectionType,
          scorePercent,
          result: isPass ? ('PASS' as const) : ('FAIL' as const),
          leadOfficer: leadOff,
          summary: isPass
            ? `Inspection completed successfully with ${scorePercent}% score.`
            : `Inspection non-compliant (${scorePercent}%). Critical observations or score below 75% threshold.`,
          certificateNumber: isPass ? certNum : undefined,
        };

        setFactories((facPrev) =>
          facPrev.map((f) => {
            if (f.id !== rec.factoryId) return f;
            return {
              ...f,
              lastAssessmentDate: historyEntry.date,
              lastAssessmentResult: historyEntry.result,
              status: isPass ? 'Active' : 'Flagged',
              assessmentHistory: [historyEntry, ...f.assessmentHistory],
            };
          })
        );

        return updatedRec;
      })
    );

    return updatedRec;
  };

  const resetToSampleData = () => {
    localStorage.removeItem(FACTORIES_STORAGE_KEY);
    localStorage.removeItem(ASSESSMENTS_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setFactories(INITIAL_FACTORIES);
    setAssessments(INITIAL_ASSESSMENTS);
    setCurrentUser(CURRENT_USER);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        logout,
        factories,
        assessments,
        availableOfficers: AVAILABLE_OFFICERS,
        addFactory,
        updateFactory,
        createAssessmentAssignment,
        updateAssessment,
        updateChecklistItem,
        addOfficerToAssessment,
        removeOfficerFromAssessment,
        saveOfficerSignature,
        saveOwnerSignature,
        finalizeAssessment,
        getAssessmentById,
        getFactoryById,
        resetToSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
