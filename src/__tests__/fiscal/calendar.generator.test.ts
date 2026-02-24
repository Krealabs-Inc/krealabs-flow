/**
 * Tests unitaires — Moteur de génération des obligations fiscales
 *
 * Contexte : GIE au régime réel simplifié TVA, créé en 2026, clôture 31/12/2026.
 *
 * Exécuter avec : pnpm test
 */

import { describe, it, expect } from "vitest";
import {
  generateObligations,
  generateMultiYearObligations,
} from "../../lib/fiscal/calendar.generator";
import {
  isBusinessDay,
  isFrenchPublicHoliday,
  isWeekend,
  nthBusinessDayOfMonth,
  adjustToBusinessDay,
} from "../../lib/fiscal/business-day.utils";
import type { CompanyConfig } from "../../lib/fiscal/obligation.types";

// ─── Config de référence ──────────────────────────────────────────────────────

/** GIE créé le 01/03/2026, première clôture 31/12/2026, réel simplifié */
const BASE_CONFIG: CompanyConfig = {
  creationDate: new Date("2026-03-01"),
  firstClosingDate: new Date("2026-12-31"),
  closingMonth: 12,
  closingDay: 31,
  tvaRegime: "reel_simplifie",
  urssafEnabled: false,
  tvaByFiscalYear: {
    2026: 12000, // 12 000 € TVA nette exercice 2026
    2027: 15000,
  },
  cfeEstimatedAmount: 800,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getByType(
  obligations: ReturnType<typeof generateObligations>["obligations"],
  type: string
) {
  return obligations.filter((o) => o.type === type);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. business-day.utils — Jours fériés et jours ouvrés
// ─────────────────────────────────────────────────────────────────────────────

describe("isFrenchPublicHoliday", () => {
  it("reconnaît le 1er janvier", () => {
    expect(isFrenchPublicHoliday(new Date("2027-01-01"))).toBe(true);
  });

  it("reconnaît le 1er mai (Fête du Travail)", () => {
    expect(isFrenchPublicHoliday(new Date("2027-05-01"))).toBe(true);
  });

  it("reconnaît le 8 mai (Victoire 1945)", () => {
    expect(isFrenchPublicHoliday(new Date("2027-05-08"))).toBe(true);
  });

  it("reconnaît le 14 juillet", () => {
    expect(isFrenchPublicHoliday(new Date("2027-07-14"))).toBe(true);
  });

  it("reconnaît le 15 août (Assomption)", () => {
    expect(isFrenchPublicHoliday(new Date("2027-08-15"))).toBe(true);
  });

  it("reconnaît le 1er novembre (Toussaint)", () => {
    expect(isFrenchPublicHoliday(new Date("2027-11-01"))).toBe(true);
  });

  it("reconnaît le 11 novembre (Armistice)", () => {
    expect(isFrenchPublicHoliday(new Date("2027-11-11"))).toBe(true);
  });

  it("reconnaît le 25 décembre (Noël)", () => {
    expect(isFrenchPublicHoliday(new Date("2027-12-25"))).toBe(true);
  });

  it("ne marque pas un jour ordinaire comme férié", () => {
    expect(isFrenchPublicHoliday(new Date("2027-03-15"))).toBe(false);
    expect(isFrenchPublicHoliday(new Date("2027-06-10"))).toBe(false);
  });
});

describe("isWeekend", () => {
  it("samedi est un week-end", () => {
    expect(isWeekend(new Date("2027-05-15"))).toBe(true); // samedi
  });

  it("dimanche est un week-end", () => {
    expect(isWeekend(new Date("2027-05-16"))).toBe(true); // dimanche
  });

  it("lundi n'est pas un week-end", () => {
    expect(isWeekend(new Date("2027-05-17"))).toBe(false); // lundi
  });
});

describe("isBusinessDay", () => {
  it("le 1er mai n'est jamais un jour ouvré", () => {
    expect(isBusinessDay(new Date("2026-05-01"))).toBe(false);
    expect(isBusinessDay(new Date("2027-05-01"))).toBe(false);
    expect(isBusinessDay(new Date("2028-05-01"))).toBe(false);
  });

  it("le 14 juillet n'est jamais un jour ouvré", () => {
    expect(isBusinessDay(new Date("2027-07-14"))).toBe(false);
  });

  it("le 25 décembre n'est jamais un jour ouvré", () => {
    expect(isBusinessDay(new Date("2027-12-25"))).toBe(false);
  });

  it("un lundi ordinaire est un jour ouvré", () => {
    expect(isBusinessDay(new Date("2027-03-01"))).toBe(true); // lundi
  });
});

describe("nthBusinessDayOfMonth", () => {
  it("retourne le 2ème jour ouvré de mai (le 1er mai est toujours férié)", () => {
    // Mai 2027 : le 1er mai est férié (samedi en 2027 + férié), 2 mai = dimanche,
    // 3 mai = lundi = 1er jour ouvré, 4 mai = mardi = 2ème jour ouvré
    const result = nthBusinessDayOfMonth(2027, 5, 2);
    expect(result.getMonth()).toBe(4); // mai = index 4
    expect(result.getDay()).not.toBe(0); // pas dimanche
    expect(result.getDay()).not.toBe(6); // pas samedi
    expect(isBusinessDay(result)).toBe(true);
  });

  it("le 2ème jour ouvré de mai tombe APRÈS le 1er mai", () => {
    // Le 1er mai est toujours férié, donc le 2ème WD est au minimum le 3 mai
    const result = nthBusinessDayOfMonth(2027, 5, 2);
    expect(result.getDate()).toBeGreaterThanOrEqual(3);
  });

  it("retourne le 1er jour ouvré de janvier 2027", () => {
    // 1er janvier 2027 = vendredi + férié → prochain = 4 janvier = lundi
    const result = nthBusinessDayOfMonth(2027, 1, 1);
    expect(isBusinessDay(result)).toBe(true);
  });
});

describe("adjustToBusinessDay", () => {
  it("retourne la date elle-même si c'est un jour ouvré", () => {
    const date = new Date("2027-03-01"); // lundi
    const result = adjustToBusinessDay(date);
    expect(result.toISOString()).toBe(date.toISOString());
  });

  it("avance au lundi si le 15 décembre est un samedi", () => {
    // Trouver une année où le 15 décembre est samedi
    // 15 décembre 2029 = samedi → doit retourner lundi 17
    const sat = new Date("2029-12-15");
    if (isWeekend(sat)) {
      const result = adjustToBusinessDay(sat);
      expect(result.getDay()).not.toBe(0);
      expect(result.getDay()).not.toBe(6);
      expect(result.getTime()).toBeGreaterThan(sat.getTime());
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. generateObligations — Année 2026 (première année)
// ─────────────────────────────────────────────────────────────────────────────

describe("generateObligations(2026) — Première année d'activité", () => {
  const result = generateObligations(2026, BASE_CONFIG);

  it("génère 0 obligation en 2026 (première année, rien à payer)", () => {
    expect(result.obligations).toHaveLength(0);
  });

  it("ne génère aucun acompte TVA (pas de TVA N-1)", () => {
    expect(getByType(result.obligations, "TVA_ACOMPTE")).toHaveLength(0);
  });

  it("ne génère pas de CA12 (déposée en mai 2027)", () => {
    expect(getByType(result.obligations, "TVA_CA12")).toHaveLength(0);
  });

  it("ne génère pas de liasse (déposée en mai 2027)", () => {
    expect(getByType(result.obligations, "LIASSE")).toHaveLength(0);
  });

  it("exonère la CFE en première année civile (art. 1478 CGI)", () => {
    expect(getByType(result.obligations, "CFE")).toHaveLength(0);
  });

  it("ne produit aucun warning pour la première année (config complète)", () => {
    // Un seul warning possible : TVA N-1 manquante pour les acomptes
    // Mais en 2026, aucun acompte n'est généré → pas de warning
    expect(result.warnings).toHaveLength(0);
  });

  it("retourne l'année 2026", () => {
    expect(result.year).toBe(2026);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. generateObligations — Année 2027
// ─────────────────────────────────────────────────────────────────────────────

describe("generateObligations(2027) — Deuxième année", () => {
  const result = generateObligations(2027, BASE_CONFIG);

  it("génère exactement 5 obligations en 2027", () => {
    // CA12 + acompte juillet + acompte décembre + liasse + CFE
    expect(result.obligations).toHaveLength(5);
  });

  // CA12
  describe("CA12 pour exercice 2026", () => {
    const ca12 = result.obligations.find((o) => o.type === "TVA_CA12");

    it("existe", () => expect(ca12).toBeDefined());

    it("est pour l'exercice fiscal 2026", () => {
      expect(ca12!.fiscalYear).toBe(2026);
    });

    it("est due en mai 2027", () => {
      expect(ca12!.dueDate.getFullYear()).toBe(2027);
      expect(ca12!.dueDate.getMonth()).toBe(4); // mai = index 4
    });

    it("est un jour ouvré", () => {
      expect(isBusinessDay(ca12!.dueDate)).toBe(true);
    });

    it("est marquée 'première année' (isFirstYear=true)", () => {
      expect(ca12!.isFirstYear).toBe(true);
    });

    it("a la clé obligationKey correcte", () => {
      expect(ca12!.obligationKey).toBe("TVA_CA12_2027");
    });

    it("contient une référence légale", () => {
      expect(ca12!.legalReference).toBeTruthy();
    });
  });

  // Acompte juillet
  describe("Acompte TVA juillet 2027 (55 %)", () => {
    const acompteJuil = result.obligations.find(
      (o) => o.type === "TVA_ACOMPTE" && o.obligationKey.includes("JUILLET")
    );

    it("existe", () => expect(acompteJuil).toBeDefined());

    it("tombe en juillet 2027", () => {
      expect(acompteJuil!.dueDate.getFullYear()).toBe(2027);
      expect(acompteJuil!.dueDate.getMonth()).toBe(6); // juillet = index 6
    });

    it("est un jour ouvré", () => {
      expect(isBusinessDay(acompteJuil!.dueDate)).toBe(true);
    });

    it("vaut 55 % × 12 000 € = 6 600 €", () => {
      expect(acompteJuil!.amount).toBeCloseTo(6600, 1);
    });

    it("a la bonne clé déterministe", () => {
      expect(acompteJuil!.obligationKey).toBe("TVA_ACOMPTE_JUILLET_2027");
    });

    it("n'est pas marqué première année", () => {
      expect(acompteJuil!.isFirstYear).toBe(false);
    });
  });

  // Acompte décembre
  describe("Acompte TVA décembre 2027 (40 %)", () => {
    const acompteDec = result.obligations.find(
      (o) => o.type === "TVA_ACOMPTE" && o.obligationKey.includes("DECEMBRE")
    );

    it("existe", () => expect(acompteDec).toBeDefined());

    it("tombe en décembre 2027", () => {
      expect(acompteDec!.dueDate.getFullYear()).toBe(2027);
      expect(acompteDec!.dueDate.getMonth()).toBe(11); // décembre = index 11
    });

    it("est un jour ouvré", () => {
      expect(isBusinessDay(acompteDec!.dueDate)).toBe(true);
    });

    it("vaut 40 % × 12 000 € = 4 800 €", () => {
      expect(acompteDec!.amount).toBeCloseTo(4800, 1);
    });

    it("a la bonne clé déterministe", () => {
      expect(acompteDec!.obligationKey).toBe("TVA_ACOMPTE_DECEMBRE_2027");
    });
  });

  // Liasse
  describe("Liasse fiscale pour exercice 2026", () => {
    const liasse = result.obligations.find((o) => o.type === "LIASSE");

    it("existe", () => expect(liasse).toBeDefined());

    it("est due en mai 2027", () => {
      expect(liasse!.dueDate.getFullYear()).toBe(2027);
      expect(liasse!.dueDate.getMonth()).toBe(4); // mai
    });

    it("est un jour ouvré", () => {
      expect(isBusinessDay(liasse!.dueDate)).toBe(true);
    });

    it("concerne l'exercice fiscal 2026", () => {
      expect(liasse!.fiscalYear).toBe(2026);
    });

    it("est marquée première année", () => {
      expect(liasse!.isFirstYear).toBe(true);
    });

    it("a la clé LIASSE_2027", () => {
      expect(liasse!.obligationKey).toBe("LIASSE_2027");
    });
  });

  // CFE
  describe("CFE 2027 (première fois due)", () => {
    const cfe = result.obligations.find((o) => o.type === "CFE");

    it("existe (exonération 2026 levée)", () => expect(cfe).toBeDefined());

    it("tombe en décembre 2027", () => {
      expect(cfe!.dueDate.getFullYear()).toBe(2027);
      expect(cfe!.dueDate.getMonth()).toBe(11); // décembre
    });

    it("est un jour ouvré", () => {
      expect(isBusinessDay(cfe!.dueDate)).toBe(true);
    });

    it("est marquée première année (première fois due)", () => {
      expect(cfe!.isFirstYear).toBe(true);
    });

    it("reprend le montant estimé depuis la config (800 €)", () => {
      expect(cfe!.amount).toBe(800);
    });

    it("a la clé CFE_2027", () => {
      expect(cfe!.obligationKey).toBe("CFE_2027");
    });
  });

  // Ordre chronologique
  it("les obligations sont triées chronologiquement", () => {
    const dates = result.obligations.map((o) => o.dueDate.getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
    }
  });

  // warningDate
  it("warningDate = dueDate − 30 jours pour chaque obligation", () => {
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    for (const o of result.obligations) {
      const diff = o.dueDate.getTime() - o.warningDate.getTime();
      expect(diff).toBe(thirtyDays);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. generateObligations — Année 2028
// ─────────────────────────────────────────────────────────────────────────────

describe("generateObligations(2028) — Troisième année", () => {
  const result = generateObligations(2028, BASE_CONFIG);

  it("génère 5 obligations en 2028", () => {
    expect(result.obligations).toHaveLength(5);
  });

  it("les acomptes 2028 sont basés sur TVA 2027 = 15 000 €", () => {
    const juil = result.obligations.find(
      (o) => o.obligationKey === "TVA_ACOMPTE_JUILLET_2028"
    );
    const dec = result.obligations.find(
      (o) => o.obligationKey === "TVA_ACOMPTE_DECEMBRE_2028"
    );
    expect(juil!.amount).toBeCloseTo(15000 * 0.55, 1); // 8 250 €
    expect(dec!.amount).toBeCloseTo(15000 * 0.4, 1); // 6 000 €
  });

  it("la CA12 de 2028 concerne l'exercice 2027", () => {
    const ca12 = result.obligations.find((o) => o.type === "TVA_CA12");
    expect(ca12!.fiscalYear).toBe(2027);
    expect(ca12!.isFirstYear).toBe(false);
  });

  it("la CFE 2028 n'est plus marquée première année", () => {
    const cfe = result.obligations.find((o) => o.type === "CFE");
    expect(cfe!.isFirstYear).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Gestion des données manquantes
// ─────────────────────────────────────────────────────────────────────────────

describe("generateObligations — TVA N-1 manquante", () => {
  const configSansTva: CompanyConfig = {
    ...BASE_CONFIG,
    tvaByFiscalYear: {}, // Aucune TVA renseignée
  };

  const result = generateObligations(2027, configSansTva);

  it("génère quand même les acomptes (sans montant)", () => {
    const acomptes = getByType(result.obligations, "TVA_ACOMPTE");
    expect(acomptes).toHaveLength(2);
  });

  it("les acomptes n'ont pas de montant calculé", () => {
    const acomptes = getByType(result.obligations, "TVA_ACOMPTE");
    acomptes.forEach((a) => expect(a.amount).toBeUndefined());
  });

  it("produit un warning explicite sur la TVA manquante", () => {
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("TVA nette");
    expect(result.warnings[0]).toContain("2026");
  });
});

describe("generateObligations — URSSAF activé", () => {
  const configUrssaf: CompanyConfig = {
    ...BASE_CONFIG,
    urssafEnabled: true,
  };

  it("génère un warning si URSSAF activé (module non implémenté)", () => {
    const result = generateObligations(2027, configUrssaf);
    const urssafWarning = result.warnings.find((w) =>
      w.toLowerCase().includes("urssaf")
    );
    expect(urssafWarning).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Toutes les dates sont des jours ouvrés
// ─────────────────────────────────────────────────────────────────────────────

describe("Toutes les dates d'échéance sont des jours ouvrés", () => {
  const years = [2027, 2028, 2029, 2030];

  for (const year of years) {
    it(`Toutes les échéances de ${year} tombent un jour ouvré`, () => {
      const result = generateObligations(year, BASE_CONFIG);
      for (const o of result.obligations) {
        expect(
          isBusinessDay(o.dueDate),
          `${o.obligationKey} : ${o.dueDate.toISOString()} n'est pas un jour ouvré`
        ).toBe(true);
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. generateMultiYearObligations
// ─────────────────────────────────────────────────────────────────────────────

describe("generateMultiYearObligations", () => {
  it("génère les résultats pour chaque année de la plage", () => {
    const results = generateMultiYearObligations(2026, 2028, BASE_CONFIG);
    expect(results).toHaveLength(3);
    expect(results[0].year).toBe(2026);
    expect(results[1].year).toBe(2027);
    expect(results[2].year).toBe(2028);
  });

  it("lève une erreur si fromYear > toYear", () => {
    expect(() =>
      generateMultiYearObligations(2028, 2026, BASE_CONFIG)
    ).toThrow();
  });

  it("total obligations : 0 + 5 + 5 = 10", () => {
    const results = generateMultiYearObligations(2026, 2028, BASE_CONFIG);
    const total = results.reduce((s, r) => s + r.obligations.length, 0);
    expect(total).toBe(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Franchise de base
// ─────────────────────────────────────────────────────────────────────────────

describe("Régime franchise_base", () => {
  const franchiseConfig: CompanyConfig = {
    ...BASE_CONFIG,
    tvaRegime: "franchise_base",
  };

  it("ne génère aucune obligation TVA", () => {
    const result = generateObligations(2027, franchiseConfig);
    const tvaObligations = result.obligations.filter((o) =>
      o.type.startsWith("TVA")
    );
    expect(tvaObligations).toHaveLength(0);
  });

  it("génère quand même la liasse et la CFE", () => {
    const result = generateObligations(2027, franchiseConfig);
    expect(getByType(result.obligations, "LIASSE")).toHaveLength(1);
    expect(getByType(result.obligations, "CFE")).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. obligationKey — Unicité et déterminisme
// ─────────────────────────────────────────────────────────────────────────────

describe("obligationKey — unicité et déterminisme", () => {
  it("tous les obligationKey de 2027 sont uniques", () => {
    const result = generateObligations(2027, BASE_CONFIG);
    const keys = result.obligations.map((o) => o.obligationKey);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it("deux appels avec la même config produisent les mêmes clés", () => {
    const r1 = generateObligations(2027, BASE_CONFIG);
    const r2 = generateObligations(2027, BASE_CONFIG);
    const keys1 = r1.obligations.map((o) => o.obligationKey).sort();
    const keys2 = r2.obligations.map((o) => o.obligationKey).sort();
    expect(keys1).toEqual(keys2);
  });

  it("les clés suivent le format attendu", () => {
    const result = generateObligations(2027, BASE_CONFIG);
    const keys = result.obligations.map((o) => o.obligationKey);
    expect(keys).toContain("TVA_CA12_2027");
    expect(keys).toContain("TVA_ACOMPTE_JUILLET_2027");
    expect(keys).toContain("TVA_ACOMPTE_DECEMBRE_2027");
    expect(keys).toContain("LIASSE_2027");
    expect(keys).toContain("CFE_2027");
  });
});
