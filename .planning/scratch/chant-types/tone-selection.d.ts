import { z } from 'zod';
/**
 * Input parameters for selecting a psalm tone.
 * At least one of these should be provided to guide tone selection.
 */
export declare const ToneSelectionInputSchema: z.ZodObject<{
    /** Antiphon mode: 0 = Peregrinus, 1-8 = standard modes */
    antiphonMode: z.ZodOptional<z.ZodNumber>;
    /** Psalm number (1-150) */
    psalmNumber: z.ZodOptional<z.ZodNumber>;
    /** Psalm part identifier, e.g., "Aleph" for Psalm 119 sections, "1"/"2" for split psalms */
    psalmPart: z.ZodOptional<z.ZodString>;
    /** Override: specific tone ID, e.g., "tone-3" */
    overrideToneId: z.ZodOptional<z.ZodString>;
    /** Override: specific variant ID, e.g., "tone-3-a" */
    overrideVariantId: z.ZodOptional<z.ZodString>;
    /** Override: specific differentia ID, e.g., "1" */
    overrideDifferentiaId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    antiphonMode?: number | undefined;
    psalmNumber?: number | undefined;
    psalmPart?: string | undefined;
    overrideToneId?: string | undefined;
    overrideVariantId?: string | undefined;
    overrideDifferentiaId?: string | undefined;
}, {
    antiphonMode?: number | undefined;
    psalmNumber?: number | undefined;
    psalmPart?: string | undefined;
    overrideToneId?: string | undefined;
    overrideVariantId?: string | undefined;
    overrideDifferentiaId?: string | undefined;
}>;
export type ToneSelectionInput = z.infer<typeof ToneSelectionInputSchema>;
/**
 * The resolved tone selection result: a specific tone, variant, and differentia,
 * along with the source that determined the selection.
 */
export declare const ToneSelectionSchema: z.ZodObject<{
    /** The full tone file data */
    tone: z.ZodObject<{
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
    /** The selected variant within the tone */
    variant: z.ZodObject<{
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
    /** The selected differentia (ending) within the variant */
    differentia: z.ZodObject<{
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
    /** How this selection was determined */
    source: z.ZodEnum<["override", "antiphon-mode", "psalm-default", "fallback"]>;
}, "strip", z.ZodTypeAny, {
    tone: {
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
    };
    variant: {
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
    };
    differentia: {
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
    };
    source: "override" | "antiphon-mode" | "psalm-default" | "fallback";
}, {
    tone: {
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
    };
    variant: {
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
    };
    differentia: {
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
    };
    source: "override" | "antiphon-mode" | "psalm-default" | "fallback";
}>;
export type ToneSelection = z.infer<typeof ToneSelectionSchema>;
