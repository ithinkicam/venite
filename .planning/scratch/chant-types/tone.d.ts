import { z } from 'zod';
/**
 * A single pitched note in scientific pitch notation.
 * Only Bb occurs as an accidental in the Gregorian/Sarum chant context.
 */
export declare const PitchSchema: z.ZodObject<{
    note: z.ZodEnum<["C", "D", "E", "F", "G", "A", "B"]>;
    octave: z.ZodNumber;
    accidental: z.ZodOptional<z.ZodEnum<["b"]>>;
}, "strip", z.ZodTypeAny, {
    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
    octave: number;
    accidental?: "b" | undefined;
}, {
    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
    octave: number;
    accidental?: "b" | undefined;
}>;
export type Pitch = z.infer<typeof PitchSchema>;
/**
 * One or more pitches sung on a single syllable.
 * The role describes this neume group's function within a formula cadence.
 */
export declare const NeumeGroupSchema: z.ZodObject<{
    notes: z.ZodArray<z.ZodObject<{
        note: z.ZodEnum<["C", "D", "E", "F", "G", "A", "B"]>;
        octave: z.ZodNumber;
        accidental: z.ZodOptional<z.ZodEnum<["b"]>>;
    }, "strip", z.ZodTypeAny, {
        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
        octave: number;
        accidental?: "b" | undefined;
    }, {
        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
        octave: number;
        accidental?: "b" | undefined;
    }>, "many">;
    role: z.ZodEnum<["intonation", "reciting", "preparation", "accent", "post-accent"]>;
}, "strip", z.ZodTypeAny, {
    notes: {
        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
        octave: number;
        accidental?: "b" | undefined;
    }[];
    role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
}, {
    notes: {
        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
        octave: number;
        accidental?: "b" | undefined;
    }[];
    role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
}>;
export type NeumeGroup = z.infer<typeof NeumeGroupSchema>;
/**
 * The cadence at the midpoint of a psalm verse (half-verse break).
 * Cadence neume groups are ordered from first sung to last sung.
 */
export declare const MediationSchema: z.ZodObject<{
    cadence: z.ZodArray<z.ZodObject<{
        notes: z.ZodArray<z.ZodObject<{
            note: z.ZodEnum<["C", "D", "E", "F", "G", "A", "B"]>;
            octave: z.ZodNumber;
            accidental: z.ZodOptional<z.ZodEnum<["b"]>>;
        }, "strip", z.ZodTypeAny, {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }, {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }>, "many">;
        role: z.ZodEnum<["intonation", "reciting", "preparation", "accent", "post-accent"]>;
    }, "strip", z.ZodTypeAny, {
        notes: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }[];
        role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
    }, {
        notes: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }[];
        role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    cadence: {
        notes: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }[];
        role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
    }[];
}, {
    cadence: {
        notes: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }[];
        role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
    }[];
}>;
export type Mediation = z.infer<typeof MediationSchema>;
/**
 * The cadence at the end of a psalm verse.
 * Cadence neume groups are ordered from first sung to last sung.
 */
export declare const TerminationSchema: z.ZodObject<{
    cadence: z.ZodArray<z.ZodObject<{
        notes: z.ZodArray<z.ZodObject<{
            note: z.ZodEnum<["C", "D", "E", "F", "G", "A", "B"]>;
            octave: z.ZodNumber;
            accidental: z.ZodOptional<z.ZodEnum<["b"]>>;
        }, "strip", z.ZodTypeAny, {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }, {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }>, "many">;
        role: z.ZodEnum<["intonation", "reciting", "preparation", "accent", "post-accent"]>;
    }, "strip", z.ZodTypeAny, {
        notes: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }[];
        role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
    }, {
        notes: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }[];
        role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    cadence: {
        notes: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }[];
        role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
    }[];
}, {
    cadence: {
        notes: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }[];
        role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
    }[];
}>;
export type Termination = z.infer<typeof TerminationSchema>;
/**
 * A specific ending pattern (differentia) for a tone variant.
 * The differentia is the termination formula that leads back into the antiphon.
 * Mediation and termination are fixed pairs — not independently combinable axes.
 */
export declare const DifferentiaSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    termination: z.ZodObject<{
        cadence: z.ZodArray<z.ZodObject<{
            notes: z.ZodArray<z.ZodObject<{
                note: z.ZodEnum<["C", "D", "E", "F", "G", "A", "B"]>;
                octave: z.ZodNumber;
                accidental: z.ZodOptional<z.ZodEnum<["b"]>>;
            }, "strip", z.ZodTypeAny, {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }, {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }>, "many">;
            role: z.ZodEnum<["intonation", "reciting", "preparation", "accent", "post-accent"]>;
        }, "strip", z.ZodTypeAny, {
            notes: {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }[];
            role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
        }, {
            notes: {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }[];
            role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        cadence: {
            notes: {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }[];
            role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
        }[];
    }, {
        cadence: {
            notes: {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }[];
            role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    label: string;
    termination: {
        cadence: {
            notes: {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }[];
            role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
        }[];
    };
}, {
    id: string;
    label: string;
    termination: {
        cadence: {
            notes: {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }[];
            role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
        }[];
    };
}>;
export type Differentia = z.infer<typeof DifferentiaSchema>;
/**
 * A complete usable psalm tone: a specific mediation variant with its differentiae.
 * Identified by the combination of base tone mode and mediation variant letter (e.g., "Tone I A").
 */
export declare const ToneVariantSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    isDefault: z.ZodBoolean;
    intonation: z.ZodArray<z.ZodObject<{
        note: z.ZodEnum<["C", "D", "E", "F", "G", "A", "B"]>;
        octave: z.ZodNumber;
        accidental: z.ZodOptional<z.ZodEnum<["b"]>>;
    }, "strip", z.ZodTypeAny, {
        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
        octave: number;
        accidental?: "b" | undefined;
    }, {
        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
        octave: number;
        accidental?: "b" | undefined;
    }>, "many">;
    recitingTone: z.ZodObject<{
        note: z.ZodEnum<["C", "D", "E", "F", "G", "A", "B"]>;
        octave: z.ZodNumber;
        accidental: z.ZodOptional<z.ZodEnum<["b"]>>;
    }, "strip", z.ZodTypeAny, {
        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
        octave: number;
        accidental?: "b" | undefined;
    }, {
        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
        octave: number;
        accidental?: "b" | undefined;
    }>;
    mediation: z.ZodObject<{
        cadence: z.ZodArray<z.ZodObject<{
            notes: z.ZodArray<z.ZodObject<{
                note: z.ZodEnum<["C", "D", "E", "F", "G", "A", "B"]>;
                octave: z.ZodNumber;
                accidental: z.ZodOptional<z.ZodEnum<["b"]>>;
            }, "strip", z.ZodTypeAny, {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }, {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }>, "many">;
            role: z.ZodEnum<["intonation", "reciting", "preparation", "accent", "post-accent"]>;
        }, "strip", z.ZodTypeAny, {
            notes: {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }[];
            role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
        }, {
            notes: {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }[];
            role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        cadence: {
            notes: {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }[];
            role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
        }[];
    }, {
        cadence: {
            notes: {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }[];
            role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
        }[];
    }>;
    differentiae: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        termination: z.ZodObject<{
            cadence: z.ZodArray<z.ZodObject<{
                notes: z.ZodArray<z.ZodObject<{
                    note: z.ZodEnum<["C", "D", "E", "F", "G", "A", "B"]>;
                    octave: z.ZodNumber;
                    accidental: z.ZodOptional<z.ZodEnum<["b"]>>;
                }, "strip", z.ZodTypeAny, {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }, {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }>, "many">;
                role: z.ZodEnum<["intonation", "reciting", "preparation", "accent", "post-accent"]>;
            }, "strip", z.ZodTypeAny, {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }, {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            cadence: {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }[];
        }, {
            cadence: {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }[];
        }>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        label: string;
        termination: {
            cadence: {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }[];
        };
    }, {
        id: string;
        label: string;
        termination: {
            cadence: {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }[];
        };
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    intonation: {
        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
        octave: number;
        accidental?: "b" | undefined;
    }[];
    id: string;
    label: string;
    isDefault: boolean;
    recitingTone: {
        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
        octave: number;
        accidental?: "b" | undefined;
    };
    mediation: {
        cadence: {
            notes: {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }[];
            role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
        }[];
    };
    differentiae: {
        id: string;
        label: string;
        termination: {
            cadence: {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }[];
        };
    }[];
}, {
    intonation: {
        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
        octave: number;
        accidental?: "b" | undefined;
    }[];
    id: string;
    label: string;
    isDefault: boolean;
    recitingTone: {
        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
        octave: number;
        accidental?: "b" | undefined;
    };
    mediation: {
        cadence: {
            notes: {
                note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                octave: number;
                accidental?: "b" | undefined;
            }[];
            role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
        }[];
    };
    differentiae: {
        id: string;
        label: string;
        termination: {
            cadence: {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }[];
        };
    }[];
}>;
export type ToneVariant = z.infer<typeof ToneVariantSchema>;
/**
 * Container for a base tone and all its variants.
 * Corresponds to one JSON data file per tone (e.g., tone-1.json).
 * Mode 0 = Tonus Peregrinus; modes 1-8 = standard modes.
 */
export declare const ToneFileSchema: z.ZodObject<{
    id: z.ZodString;
    mode: z.ZodNumber;
    name: z.ZodString;
    variants: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        isDefault: z.ZodBoolean;
        intonation: z.ZodArray<z.ZodObject<{
            note: z.ZodEnum<["C", "D", "E", "F", "G", "A", "B"]>;
            octave: z.ZodNumber;
            accidental: z.ZodOptional<z.ZodEnum<["b"]>>;
        }, "strip", z.ZodTypeAny, {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }, {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }>, "many">;
        recitingTone: z.ZodObject<{
            note: z.ZodEnum<["C", "D", "E", "F", "G", "A", "B"]>;
            octave: z.ZodNumber;
            accidental: z.ZodOptional<z.ZodEnum<["b"]>>;
        }, "strip", z.ZodTypeAny, {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }, {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }>;
        mediation: z.ZodObject<{
            cadence: z.ZodArray<z.ZodObject<{
                notes: z.ZodArray<z.ZodObject<{
                    note: z.ZodEnum<["C", "D", "E", "F", "G", "A", "B"]>;
                    octave: z.ZodNumber;
                    accidental: z.ZodOptional<z.ZodEnum<["b"]>>;
                }, "strip", z.ZodTypeAny, {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }, {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }>, "many">;
                role: z.ZodEnum<["intonation", "reciting", "preparation", "accent", "post-accent"]>;
            }, "strip", z.ZodTypeAny, {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }, {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            cadence: {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }[];
        }, {
            cadence: {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }[];
        }>;
        differentiae: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            termination: z.ZodObject<{
                cadence: z.ZodArray<z.ZodObject<{
                    notes: z.ZodArray<z.ZodObject<{
                        note: z.ZodEnum<["C", "D", "E", "F", "G", "A", "B"]>;
                        octave: z.ZodNumber;
                        accidental: z.ZodOptional<z.ZodEnum<["b"]>>;
                    }, "strip", z.ZodTypeAny, {
                        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                        octave: number;
                        accidental?: "b" | undefined;
                    }, {
                        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                        octave: number;
                        accidental?: "b" | undefined;
                    }>, "many">;
                    role: z.ZodEnum<["intonation", "reciting", "preparation", "accent", "post-accent"]>;
                }, "strip", z.ZodTypeAny, {
                    notes: {
                        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                        octave: number;
                        accidental?: "b" | undefined;
                    }[];
                    role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
                }, {
                    notes: {
                        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                        octave: number;
                        accidental?: "b" | undefined;
                    }[];
                    role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                cadence: {
                    notes: {
                        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                        octave: number;
                        accidental?: "b" | undefined;
                    }[];
                    role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
                }[];
            }, {
                cadence: {
                    notes: {
                        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                        octave: number;
                        accidental?: "b" | undefined;
                    }[];
                    role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
                }[];
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            termination: {
                cadence: {
                    notes: {
                        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                        octave: number;
                        accidental?: "b" | undefined;
                    }[];
                    role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
                }[];
            };
        }, {
            id: string;
            label: string;
            termination: {
                cadence: {
                    notes: {
                        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                        octave: number;
                        accidental?: "b" | undefined;
                    }[];
                    role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
                }[];
            };
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        intonation: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }[];
        id: string;
        label: string;
        isDefault: boolean;
        recitingTone: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        };
        mediation: {
            cadence: {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }[];
        };
        differentiae: {
            id: string;
            label: string;
            termination: {
                cadence: {
                    notes: {
                        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                        octave: number;
                        accidental?: "b" | undefined;
                    }[];
                    role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
                }[];
            };
        }[];
    }, {
        intonation: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }[];
        id: string;
        label: string;
        isDefault: boolean;
        recitingTone: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        };
        mediation: {
            cadence: {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }[];
        };
        differentiae: {
            id: string;
            label: string;
            termination: {
                cadence: {
                    notes: {
                        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                        octave: number;
                        accidental?: "b" | undefined;
                    }[];
                    role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
                }[];
            };
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    mode: number;
    name: string;
    variants: {
        intonation: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }[];
        id: string;
        label: string;
        isDefault: boolean;
        recitingTone: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        };
        mediation: {
            cadence: {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }[];
        };
        differentiae: {
            id: string;
            label: string;
            termination: {
                cadence: {
                    notes: {
                        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                        octave: number;
                        accidental?: "b" | undefined;
                    }[];
                    role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
                }[];
            };
        }[];
    }[];
}, {
    id: string;
    mode: number;
    name: string;
    variants: {
        intonation: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        }[];
        id: string;
        label: string;
        isDefault: boolean;
        recitingTone: {
            note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
            octave: number;
            accidental?: "b" | undefined;
        };
        mediation: {
            cadence: {
                notes: {
                    note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                    octave: number;
                    accidental?: "b" | undefined;
                }[];
                role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
            }[];
        };
        differentiae: {
            id: string;
            label: string;
            termination: {
                cadence: {
                    notes: {
                        note: "C" | "D" | "E" | "F" | "G" | "A" | "B";
                        octave: number;
                        accidental?: "b" | undefined;
                    }[];
                    role: "intonation" | "reciting" | "preparation" | "accent" | "post-accent";
                }[];
            };
        }[];
    }[];
}>;
export type ToneFile = z.infer<typeof ToneFileSchema>;
