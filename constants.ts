import { Procedure } from './types';

const rawProcedureData = `Category,Subcategory,Description,ControlName,Options
Gastrointestinal,NG Tube,NG w/lavage,Procedures01_NGWithLavage_chk,NA
Gastrointestinal,NG Tube,NG w/suction,Procedures01_NGWithSuction_chk,NA
Gastrointestinal,Peritoneal Procedures,Peritoneal,Procedures01_Peritoneal_cbo,Paracentesis without imaging; Paracentesis with imaging; Peritoneal Lavage
Gastrointestinal,G-Tube,G-tube Reposition,Procedures01_GTubeReposition_chk,NA
Gastrointestinal,G-Tube,G-tube Replacement,Procedures01_GTubeReplacement_chk,NA
Gastrointestinal,Anoscopy,Anoscopy,Procedures01_Anoscopy_chk,NA
Genitourinary,Bladder Procedures,Bladder Scan,Procedures01_BladderScan_chk,NA
Genitourinary,Bladder Procedures,Irrigation - Bladder,Procedures01_IrrigationBladder_chk,NA
Genitourinary,Foley Catheter,Foley Catheter Complex,Procedures01_FoleyCatheterComplex_chk,NA
Genitourinary,Foley Catheter,Foley Catheter Simple,Procedures01_FoleyCatheterSimple_chk,NA
Genitourinary,Cystostomy,Cystostomy Tube Change,Procedures01_CystostomyTubeChange_chk,NA
Genitourinary,Catheterization,Catheter - Straight Cath,Procedures01_CatheterStraighCath_chk,NA
Genitourinary,Catheterization,Cath for UA Straight/Quick,Procedures01_CathForUA_chk,NA
Cardiovascular,Arterial Access,Arterial Catheterization Insertion,Procedures01_ArterialCat_chk,NA
Cardiovascular,Pacemaker,Pacer Internal Temporary,Procedures01_PacerInternalTemp_chk,NA
Cardiovascular,PICC Line,PICC Line >= 5 years,Procedures01_PICCLineGTE5_chk,NA
Cardiovascular,PICC Line,PICC Line < 5 years,Procedures01_PICCLineLT5_chk,NA
Cardiovascular,Pericardial Procedures,Pericardiocentesis,Procedures01_Pericardiocentesis_chk,NA
Cardiovascular,Pacemaker,Pacer External,Procedures01_PacerExternal_chk,NA
Cardiovascular,Vascular Access,Declot Vascular Device,Procedures01_DeclotVascularDevice_chk,NA
Cardiovascular,Resuscitation,CPR,Procedures01_CPR_chk,NA
Cardiovascular,Central Line,Central Line >= 5 years old,Procedures01_CentralLineGTE5_chk,NA
Cardiovascular,Central Line,Central line < 5 years old,Procedures01_CentralLineLT5_chk,NA
Cardiovascular,Cardioversion,Cardioversion (Electric),Procedures01_CardioversionElectric_chk,NA
Cardiovascular,Cardiac Monitoring,Cardiac Monitor,Procedures01_CardiacMonitor_chk,NA
Pulmonary,Thoracic Procedures,Chest Tube,Procedures01_ChestTubes_cbo,Left; Right; Bilateral
Pulmonary,Thoracic Procedures,Thoracentesis,Procedures01_Thoracentesis_cbo,Thoracentesis without imaging guidance; Thoracentesis without imaging guidance - bilateral; Thoracentesis with imaging guidance; Thoracentesis with imaging guidance - bilateral
Pulmonary,Thoracic Procedures,Pleural Drainage,Procedures01_PleuralDrainage_cbo,Pleural drainage without imaging guidance; Pleural drainage without imaging guidance - bilateral; Pleural drainage with imaging guidance; Pleural drainage with imaging guidance - bilateral
Pulmonary,Non-Invasive Ventilation,C-Pap,Procedures01_CPap_chk,NA
Pulmonary,Non-Invasive Ventilation,Bi-Pap,Procedures01_BiPap_chk,NA
Pulmonary,Nebulizer Therapy,Nebulizer RT,Procedures01_NebulizerRTRepeat_cbo,1; 2; 3; 4; 5
Pulmonary,Tracheostomy,Tracheostomy,Procedures01_Tracheostomy_chk,NA
Pulmonary,Nebulizer Therapy,Nebulizer ED,Procedures01_NebulizerRepeat_cbo,1; 2; 3; 4; 5
Pulmonary,Airway Management,Intubation,Procedures01_Intubation_cbo,EMS; ED MD; Anesthesia
Pulmonary,Respiratory Support,Oxygen Therapy,Procedures01_OxygenTherapy_chk,NA
Pulmonary,Respiratory Support,End Tidal CO2,Procedures01_EndTidalCO2_chk,NA
Pulmonary,Airway Management,Cricothyroidotomy,Procedures01_Cricothyroidotomy_chk,NA
Nose,Nasal Packing,Nasal Pack Posterior Subsequent,Procedures02_NasalPackPosteriorSubseq_chk,NA
Nose,Nasal Packing,Nasal Pack Posterior Initial,Procedures02_NasalPackPosteriorInitial_chk,NA
Nose,Nasal Packing,Nasal Pack Anterior,Procedures02_NasalPackAnterior_cbo,Simple-Left; Simple-Right; Simple-Bilateral; Complex-Left; Complex-Right; Complex-Bilateral
Nose,Nasal Cautery,Nasal Cautery,Procedures02_NasalCautery_cbo,Left; Right; Bilateral
Nose,Nasal Packing,Nasal Pack - Balloon,Procedures02_NasalPackBalloon_cbo,Left; Right; Bilateral
Eye,Foreign Body Removal,FB Cornea w/o Slit Lamp,Procedures02_FBCorneaWOSlitLamp_chk,Left; Right; Bilateral
Eye,Foreign Body Removal,FB Cornea w/ Slit Lamp,Procedures02_FBCorneaWithSlitLamp_chk,Left; Right; Bilateral
Eye,Foreign Body Removal,FB Conjunctiva Superficial,Procedures02_FBConjunctivaSuperficial_chk,Left; Right; Bilateral
Eye,Foreign Body Removal,FB Conjunctiva Embedded,Procedures02_FBConjunctivaEmbedded_chk,Left; Right; Bilateral
Ear,Cerumen Removal,,Procedures02_ImpactedCerumen2_cbo,Removal by Irrigation/Lavage - Left; Removal by Irrigation/Lavage - Right; Removal by Irrigation/Lavage - Bilateral
Ear,Cerumen Removal,,Procedures02_ImpactedCerumen1_cbo,asdfadsf; Removal by Instrumentation - Left; Removal by Instrumentation - Right; Removal by Instrumentation - Bilateral
Procedural Sedation,Sedation Management,Procedural Sedation,Procedures02_ProceduralSedation_cbo,Sedation Only <5 yrs; Sedation Only >=5 yrs; Procedure/Sedation <5 yrs; Procedure/Sedation >=5 yrs
Procedural Sedation,Sedation Management,Duration (in mins),Procedures02_ProceduralSedationDuration_txt,NA
Quality Indicators,General Quality,Options,Procedures02_QI_Option05_chk,NA
Quality Indicators,General Quality,Options,Procedures02_QI_Option04_chk,NA
Quality Indicators,General Quality,Options,Procedures02_QI_Option03_chk,NA
Quality Indicators,General Quality,Options,Procedures02_QI_Option02_chk,NA
Quality Indicators,General Quality,Options,Procedures02_QI_Option01_chk,NA
Quality Indicators,General Quality,Procedure Time Out,Procedures02_ProcedureTimeOut_chk,NA
Obstetrics,Fetal Monitoring,Fetal Non-Stress Test,Procedures02_FetalNonStressTest_chk,NA
Obstetrics,Delivery,Vaginal Delivery,Procedures02_VaginalDelivery_chk,NA
Obstetrics,Neonatal Resuscitation,Newborn Resuscitation,Procedures02_NewbornResuscitation_chk,NA
Obstetrics,Delivery,Cesarean Section,Procedures02_CesareanSection_chk,NA
Special Procedures,Telehealth,Telehealth Services,Procedures02_TelehealthServices_chk,NA
Neurology,Spinal Procedures,Lumbar Puncture,Procedures02_LumbarPuncture_chk,NA
Neurology,Spinal Procedures,Epidural Blood Patch,Procedures02_EpiduralBloodPatch_chk,NA
Cast Changes,Minor Ortho,Unna Boot,Orthopedics_UnnaBoot_chk,Left; Right; Bilateral
Cast Changes,Immobilization Change,,Orthopedics_CastChangesSimpleImmob1_cbo,Arm - Custom Long Splint - 50; Arm - Custom Long Splint - LT; Arm - Custom Long Splint - RT; Arm - Custom Short Splint - 50; Arm - Custom Short Splint - LT; Arm - Custom Short Splint - RT; Arm - Preformed Long Splint - 50; Arm - Preformed Long Splint - LT; Arm - Preformed Long Splint - RT; Arm - Preformed Short Splint - 50; Arm - Preformed Short Splint - LT; Arm - Preformed Short Splint - RT; Elbow/Wrist Strapping - 50; Elbow/Wrist Strapping - LT; Elbow/Wrist Strapping - RT; Leg - Custom Long Splint - 50; Leg - Custom Long Splint - LT; Leg - Custom Long Splint - RT; Leg - Custom Short Splint - 50; Leg - Custom Short Splint - LT; Leg - Custom Short Splint - RT; Leg - Preformed Long Splint - 50; Leg - Preformed Long Splint - LT; Leg - Preformed Long Splint - RT; Leg - Preformed Short Splint - 50; Leg - Preformed Short Splint - LT; Leg - Preformed Short Splint - RT; Shoulder Strapping - 50; Shoulder Strapping - LT; Shoulder Strapping - RT
Cast Changes,Cast Application,Walker - Add to Existing Cast,Orthopedics_WalkerAddToExistingCast_chk,Left; Right; Bilateral
Cast Changes,Immobilization Change,,Orthopedics_CastChangesSimpleImmob2_cbo,Arm - Custom Long Splint - 50; Arm - Custom Long Splint - LT; Arm - Custom Long Splint - RT; Arm - Custom Short Splint - 50; Arm - Custom Short Splint - LT; Arm - Custom Short Splint - RT; Arm - Preformed Long Splint - 50; Arm - Preformed Long Splint - LT; Arm - Preformed Long Splint - RT; Arm - Preformed Short Splint - 50; Arm - Preformed Short Splint - LT; Arm - Preformed Short Splint - RT; Elbow/Wrist Strapping - 50; Elbow/Wrist Strapping - LT; Elbow/Wrist Strapping - RT; Leg - Custom Long Splint - 50; Leg - Custom Long Splint - LT; Leg - Custom Long Splint - RT; Leg - Custom Short Splint - 50; Leg - Custom Short Splint - LT; Leg - Custom Short Splint - RT; Leg - Preformed Long Splint - 50; Leg - Preformed Long Splint - LT; Leg - Preformed Long Splint - RT; Leg - Preformed Short Splint - 50; Leg - Preformed Short Splint - LT; Leg - Preformed Short Splint - RT; Shoulder Strapping - 50; Shoulder Strapping - LT; Shoulder Strapping - RT
Cast Changes,Cast Modification,Bivalve Long Arm Cast,Orthopedics_BivalveLongArmCast_chk,Left; Right; Bilateral
Cast Changes,Cast Removal,Remove Long Arm Cast,Orthopedics_RemoveLongArmCast_chk,Left; Right; Bilateral
Cast Changes,Cast Removal,Remove Arm Cast Gauntlet,Orthopedics_RemoveArmCastGauntlet_chk,Left; Right; Bilateral
Cast Changes,Cast Modification,Wedge Cast,Orthopedics_WedgeCast_chk,Left; Right; Bilateral
Cast Changes,Cast Modification,Window Cast,Orthopedics_WindowCast_chk,Left; Right; Bilateral
Cast Changes,Cast Modification,Bivalve Leg Cast,Orthopedics_BivalveLegCast_chk,Left; Right; Bilateral
Cast Changes,Cast Removal,Remove Leg Cast,Orthopedics_RemoveLegCast_chk,Left; Right; Bilateral
Cast Changes,Cast Modification,Bivalve Short Arm Cast Gauntlet,Orthopedics_BivalveShortArmCastGauntlet_chk,Left; Right; Bilateral
Quality Indicators,General Quality,Options,Orthopedics_QI_Option05_chk,NA
Quality Indicators,General Quality,Options,Orthopedics_QI_Option04_chk,NA
Quality Indicators,General Quality,Options,Orthopedics_QI_Option03_chk,NA
Quality Indicators,General Quality,Options,Orthopedics_QI_Option02_chk,NA
Quality Indicators,General Quality,Options,Orthopedics_QI_Option01_chk,NA
Quality Indicators,General Quality,Incomplete Ortho Note,Orthopedics_QI_IncompleteOrthoNote_chk,NA
Burns,Escharotomy,Escharotomy,Surgical_Lacerations_Escharotomy_cbo,1; 2; 3; 4; 5
Burns,First Degree,First Degree Local Treatment Initial,Surgical_Lacerations_FirstDegreeLocalTreatmentInitial_chk,NA
Burns,Partial Thickness,Partial Thickness Whole Face/Extremity,Surgical_Lacerations_PartialThicknessWholeFace_chk,NA
Burns,Partial Thickness,Partial Thickness Medium 5-10%,Surgical_Lacerations_PartialThicknessMedium510_chk,NA
Burns,Partial Thickness,Partial Thickness Small < 5%,Surgical_Lacerations_PartialThicknessSmallLT5_chk,NA
Burns,Partial Thickness,Partial Thickness > 1 Extremity or > 10%,Surgical_Lacerations_PartialThicknessGT1_chk,NA
Quality Indicators,Surgical Quality,Options,Surgical_QI_Option03_chk,NA
Quality Indicators,Surgical Quality,Options,Surgical_QI_Option02_chk,NA
Quality Indicators,Surgical Quality,Options,Surgical_QI_Option01_chk,NA
Quality Indicators,Surgical Quality,Incompleted FB/ID Note,Surgical_IncompletedFBIDNote_chk,NA
Quality Indicators,Surgical Quality,Incompleted Laceration Note,Surgical_QI_IncompletedLacerationNote_chk,NA
Wound Dehiscence,Superficial Simple,Superficial Wound Dehiscence Simple,Surgical_Lacerations_SuperficialWoundDehiscenceSimple_chk,NA
Wound Dehiscence,Complex/Extensive,Secondary Closure Surgical Wound Complicated/Extensive,Surgical_Lacerations_SecondaryClosureSurgicalWound_chk,NA
Wound Dehiscence,Superficial With Packing,Superficial Wound Dehiscence With Packing,Surgical_Lacerations_SuperficialWoundDehiscenceWithPacking_chk,NA
FB/ID,Foreign Body Removal,Nose,Surgical_FBID_ForeignBodyRemoval_Nose_chk,Left; Right; Bilateral
FB/ID,Foreign Body Removal,Ear,Surgical_FBID_ForeignBodyRemoval_Ear_chk,Left; Right; Bilateral
FB/ID,Foreign Body Removal,Laryngoscopy,Surgical_FBID_ForeignBodyRemoval_Laryngoscopy_cbo,Laryngoscopy indirect - diagnostic; Laryngoscopy indirect - FB removal; Laryngoscopy direct - FB removal; Laryngoscopy flexible - diagnostic; Laryngoscopy flexible - removal of foreign body(s)
FB/ID,Foreign Body Removal,Rectum/Rigid Scope,Surgical_FBID_ForeignBodyRemoval_RectumRigidScope_chk,NA
FB/ID,Foreign Body Removal,Rectum/Flexible Scope,Surgical_FBID_ForeignBodyRemoval_RectumFlexibleScope_chk,NA
FB/ID,Foreign Body Removal,Vagina,Surgical_FBID_ForeignBodyRemoval_Vagina_chk,NA
FB/ID,Foreign Body Removal,Pharynx,Surgical_FBID_ForeignBodyRemoval_Pharynx_chk,NA
FB/ID,Inject or Aspirate Joints,Large w/ US guidance,Surgical_FBID_InjectAspirateJoints_Large_Guidance_chk,NA
FB/ID,Inject or Aspirate Joints,Small w/ US guidance,Surgical_FBID_InjectAspirateJoints_Small_Guidance_chk,NA
FB/ID,Inject or Aspirate Joints,Medium w/ US guidance,Surgical_FBID_InjectAspirateJoints_Medium_Guidance_chk,NA
FB/ID,Inject or Aspirate Joints,Large w/out US guidance,Surgical_FBID_InjectAspirateJoints_Large_chk,NA
FB/ID,Inject or Aspirate Joints,Small w/out US guidance,Surgical_FBID_InjectAspirateJoints_Small_chk,NA
FB/ID,Inject or Aspirate Joints,Medium w/out US guidance,Surgical_FBID_InjectAspirateJoints_Medium_chk,NA
FB/ID,Inject or Aspirate Joints,Ganglion Cyst,Surgical_FBID_InjectAspirateJoints_GanglionCyst_chk,NA
FB/ID,Blocks For Pain,TMJ/Dental Pain,Surgical_FBID_BlocksForPain_DentalPain_chk,Left; Right; Bilateral
FB/ID,Blocks For Pain,TMJ/Dental Pain,Surgical_FBID_BlocksForPain_TMJJoint_chk,Left; Right; Bilateral
FB/ID,Blocks For Pain,Digital Block For Pain (not lacerations),Surgical_FBID_BlocksForPain_DigitialBlock_chk,Left; Right; Bilateral
FB/ID,Blocks For Pain,Muscle,Surgical_FBID_BlocksForPain_Muscle_chk,NA
FB/ID,Blocks For Pain,Tendon,Surgical_FBID_BlocksForPain_Tendon_chk,NA
FB/ID,Nails,Avulsion of Nail Plate,Surgical_FBID_Nails_AvulsionOfNailPlate_cbo,1; 2; 3; 4; 5
FB/ID,Nails,Debridement of Nails 6 or more,Surgical_FBID_Nails_DebridementOfNails6_chk,NA
FB/ID,Nails,Reconstruction of Nail Bed w/Graft,Surgical_FBID_Nails_ReconstructionOfNailBedWithGraft_chk,NA
FB/ID,Nails,Trimming of Nails,Surgical_FBID_Nails_TrimmingOfNails_chk,NA
FB/ID,Nails,Debridement of Nail 1-5,Surgical_FBID_Nails_DebridementOfNail15_chk,NA
FB/ID,Nails,Repair of Nailbed,Surgical_FBID_Nails_RepairOfNailbed_chk,NA
FB/ID,Nails,Drain Subungual Hematoma,Surgical_FBID_Nails_DrainSubungualHematoma_chk,NA
FB/ID,Nails,Wedge Excision of Skin of Nail Fold,Surgical_FBID_Nails_WedgeResectionToenail_chk,NA
FB/ID,Nails,Excision of Nail and Nail Matrix,Surgical_FBID_Nails_ExciseIngrownToenail_chk,NA
FB/ID,Incision And Drainage,Fluid Collection Image-guided,Surgical_FBID_IncisionDrainage_FluidCol_chk,NA
FB/ID,Incision And Drainage,Eyelid,Surgical_FBID_IncisionDrainage_Eyelid_chk,NA
FB/ID,Incision And Drainage,Puncture Aspiration of Abscess,Surgical_FBID_IncisionDrainage_PAA_chk,NA
FB/ID,Incision And Drainage,Postoperative Wound,Surgical_FBID_IncisionDrainage_IDComplexPostOp_chk,NA
FB/ID,Incision And Drainage,Palate/Uvula,Surgical_FBID_IncisionDrainage_PalateUvula_chk,NA
FB/ID,Incision And Drainage,Hematoma/seroma/fluid collection,Surgical_FBID_IncisionDrainage_Hematoma_chk,NA
FB/ID,Incision And Drainage,External Auditory Canal,Surgical_FBID_IncisionDrainage_ExteranlAuditory_chk,NA
FB/ID,Incision And Drainage,Perirectal Abscess,Surgical_FBID_IncisionDrainage_PerirectalAbscess_chk,NA
FB/ID,Incision And Drainage,Perianal Abscess,Surgical_FBID_IncisionDrainage_PerianalAbscess_chk,NA
FB/ID,Incision And Drainage,Peritoneal Abscess,Surgical_FBID_IncisionDrainage_PeritonealAbscess_chk,NA
FB/ID,Incision And Drainage,Vulva/Perineal,Surgical_FBID_IncisionDrainage_VulvaPerineal_chk,NA
FB/ID,Incision And Drainage,Hemorrhoid,Surgical_FBID_IncisionDrainage_Hemorrhoid_chk,NA
FB/ID,Incision And Drainage,Scrotum,Surgical_FBID_IncisionDrainage_Scrotum_chk,NA
FB/ID,Incision And Drainage,Rectum,Surgical_FBID_IncisionDrainage_Rectum_chk,NA
FB/ID,Incision And Drainage,Dental,Surgical_FBID_IncisionDrainage_Dental_chk,NA
FB/ID,Incision And Drainage,Peritonsillar,Surgical_FBID_IncisionDrainage_Peritonsilar_chk,NA
FB/ID,Incision And Drainage,Bartholin Cyst,Surgical_FBID_IncisionDrainage_BartholinCyst_chk,NA
Misc,Unlisted Procedure,,ComboBoxEdit2,"Reimplant digit exc thumb complete amputation; Reimplant, thumb; Metacarpal w/w/o interosseous transfer; Phalanx w closure any joint; Phalanx w local flaps any joint; Foot midtarsal; Foot transmetatarsal; Toe Metatarsal; Toe Metatarsophalangeal joint; Toe Interphalangeal joint"
Misc,Unlisted Procedure,2),Surgical_Misc_UnlistedProcedure02_cbo,"Abdomen; Casting/Strapping; Elbow/Humerus; Forearm/Wrist; Genitalia Female; Genitalia Male; Hand/Finger; Intestine - Small; Leg/Ankle; Penis - Tx priapism injection; Penis Tx - Irrigation for treatment of priapism; Pharanx/Adenoids/Tonsil; Rectum; Skin,Mucous Membrane,Subcutaneous; Testis - reduction of torsion; Trachea/Bronchi; Vascular Surgery"
Misc,Unlisted Procedure,,ComboBoxEdit1,"Reimplant digit exc thumb complete amputation; Reimplant, thumb; Metacarpal w/w/o interosseous transfer; Phalanx w closure any joint; Phalanx w local flaps any joint; Foot midtarsal; Foot transmetatarsal; Toe Metatarsal; Toe Metatarsophalangeal joint; Toe Interphalangeal joint"
Misc,Unlisted Procedure,1),Surgical_Misc_UnlistedProcedure01_cbo,"Abdomen; Casting/Strapping; Elbow/Humerus; Forearm/Wrist; Genitalia Female; Genitalia Male; Hand/Finger; Intestine - Small; Leg/Ankle; Penis - Tx priapism injection; Penis Tx - Irrigation for treatment of priapism; Pharanx/Adenoids/Tonsil; Rectum; Skin,Mucous Membrane,Subcutaneous; Testis - reduction of torsion; Trachea/Bronchi; Vascular Surgery"
Misc,Debridement/Tissue Treatments,2),Surgical_Misc_TissueTreatments02_cbo,"Debridement - Open wound skin only first 20 sq cm or less; Debridement - Infected skin 10% BSA; Debridement - Skin and SC tissue with open fracture; Debridement - Bone with open fracture; Debridement - SC tissue first 20 sq cm or less; Debridement - Muscle and or fascia first 20 sq cm or less; Debridement - Bone first 20 sq cm or less; Chemical cautery of tissue; Scalp/Arm/Leg Tissue Transfer 10.1-30 sq cm; Forehead/Cheek/Chin/Mouth up to 10 sq cm; Neck/Axillae/Hand/Feet/Genitalia up to 10 sq cm; Forehead/Cheek/Chin/Mouth 10.1 - 30 sq cm; Neck/Axillae/Hand/Feet/Genitalia 10.1 -30 sq cm; Eyelid/Nose/Ear/Lip up to 10 sq cm; Eyelid/Nose/Ear/Lip 10.1 - 30 sq cm; Tissue tx - Any area, 30.1sq cm - 60.0 sq cm; Tissue tx - Any area, each additional 30.0 sq cm"
Misc,Debridement/Tissue Treatments,1),Surgical_Misc_TissueTreatments01_cbo,"Debridement - Open wound skin only first 20 sq cm or less; Debridement - Infected skin 10% BSA; Debridement - Skin and SC tissue with open fracture; Debridement - Bone with open fracture; Debridement - SC tissue first 20 sq cm or less; Debridement - Muscle and or fascia first 20 sq cm or less; Debridement - Bone first 20 sq cm or less; Chemical cautery of tissue; Scalp/Arm/Leg Tissue Transfer 10.1-30 sq cm; Forehead/Cheek/Chin/Mouth up to 10 sq cm; Neck/Axillae/Hand/Feet/Genitalia up to 10 sq cm; Forehead/Cheek/Chin/Mouth 10.1 - 30 sq cm; Neck/Axillae/Hand/Feet/Genitalia 10.1 -30 sq cm; Eyelid/Nose/Ear/Lip up to 10 sq cm; Eyelid/Nose/Ear/Lip 10.1 - 30 sq cm; Tissue tx - Any area, 30.1sq cm - 60.0 sq cm; Tissue tx - Any area, each additional 30.0 sq cm"
Misc,Tendon Repairs,2),Surgical_Misc_TendonRepairs02_cbo,Achilles Tendon Repair; Digital Flexor Tendon Sheath Repair; Extensor Tendon (Mallet) Closed Tx Distal; Extensor Tendon Distal w/o Graft (Mallet); Finger Extensor Tendon; Foot Extensor Tendon Repair; Foot Flexor Tendon Repair; Forearm/Wrist Tendon Flexor Repair; Hand Extensor Tendon; Infrapatellar Tendon Repair; Interphalangeal Collateral Ligament Repair; Metacarpophalengeal Collateral Ligament Repair
Misc,Tendon Repairs,1),Surgical_Misc_TendonRepairs01_cbo,Achilles Tendon Repair; Digital Flexor Tendon Sheath Repair; Extensor Tendon (Mallet) Closed Tx Distal; Extensor Tendon Distal w/o Graft (Mallet); Finger Extensor Tendon; Foot Extensor Tendon Repair; Foot Flexor Tendon Repair; Forearm/Wrist Tendon Flexor Repair; Hand Extensor Tendon; Infrapatellar Tendon Repair; Interphalangeal Collateral Ligament Repair; Metacarpophalengeal Collateral Ligament Repair
Misc,Nerve Repairs,2),Surgical_Misc_NerveRepairs02_cbo,Hand/Foot Digital Nerve; Hand/Foot Sensory Nerve; Ulnar Motor Nerve; TBD
Misc,Nerve Repairs,1),Surgical_Misc_NerveRepairs01_cbo,Hand/Foot Digital Nerve; Hand/Foot Sensory Nerve; Ulnar Motor Nerve; TBD
Misc,Lesions,2),Surgical_Misc_Lesions02_cbo,Destruction Benign Cutaneous Lesion Laser < 10 sq cm; Trunk/Arm/Leg Excision 1.1 - 2 cm; Trunk/Arm/Leg Excision 2.1 - 3 cm; Trunk/Arm/Leg Excision 3.1 - 4 cm; Scalp/Neck/Hand/Feet/Genitalia 1.1 - 2 cm; Scalp/Neck/Hand/Feet/Genitalia 2.1 - 3 cm; Scalp/Neck/Hand/Feet/Genitalia 3.1 - 4 cm; Trunk/Arm/Leg Malignant <.5 cm; Trunk/Arm/Leg Malignant .6 - 1.0 cm; Trunk/Arm/Leg Malignant 1.1 -2.0 cm; Trunk/Arm/Leg Malignant 2.1 - 3.0 cm; Trunk/Arm/Leg Malignant 3.1- 4.0 cm; Trunk/Arm/Leg Malignant > 4 cm
Misc,Lesions,1),Surgical_Misc_Lesions01_cbo,Destruction Benign Cutaneous Lesion Laser < 10 sq cm; Trunk/Arm/Leg Excision 1.1 - 2 cm; Trunk/Arm/Leg Excision 2.1 - 3 cm; Trunk/Arm/Leg Excision 3.1 - 4 cm; Scalp/Neck/Hand/Feet/Genitalia 1.1 - 2 cm; Scalp/Neck/Hand/Feet/Genitalia 2.1 - 3 cm; Scalp/Neck/Hand/Feet/Genitalia 3.1 - 4 cm; Trunk/Arm/Leg Malignant <.5 cm; Trunk/Arm/Leg Malignant .6 - 1.0 cm; Trunk/Arm/Leg Malignant 1.1 -2.0 cm; Trunk/Arm/Leg Malignant 2.1 - 3.0 cm; Trunk/Arm/Leg Malignant 3.1- 4.0 cm; Trunk/Arm/Leg Malignant > 4 cm
Misc,Grafts,2),Surgical_Misc_Grafts02_cbo,Surgical Prep Recipient Site Exc of Wound/Scar; Full Thickness Graft Scalp/Arm/Leg < 20 cm; Full Thickness Graft Forehead/Cheek/Chin/Mouth < 20 cm; Full Thickness Graft Axillae/Hand/Foot/Genitalia < 20 cm; Muscle Flap Head/Neck; Graft Composite Full Thickness
Misc,Grafts,1),Surgical_Misc_Grafts01_cbo,Surgical Prep Recipient Site Exc of Wound/Scar; Full Thickness Graft Scalp/Arm/Leg < 20 cm; Full Thickness Graft Forehead/Cheek/Chin/Mouth < 20 cm; Full Thickness Graft Axillae/Hand/Foot/Genitalia < 20 cm; Muscle Flap Head/Neck; Graft Composite Full Thickness
Misc,Explore Wounds,2),Surgical_Misc_ExploreWounds02_cbo,Wound Abd/Flank/Back; Wound Chest; Wound Extremity; Wound Neck; TBD
Misc,Explore Wounds,1),Surgical_Misc_ExploreWounds01_cbo,Wound Abd/Flank/Back; Wound Chest; Wound Extremity; Wound Neck; TBD
Misc,Dental,2),Surgical_Misc_Dental02_cbo,Forcep extraction tooth; May need to add more
Misc,Dental,1),Surgical_Misc_Dental01_cbo,Forcep extraction tooth; May need to add more
Misc,Blood Vessel Repair,2),Surgical_Misc_BloodVesselRepair02_cbo,Finger Blood Vessel; Hand Blood Vessel; Ligation Major Artery Extremity Trauma; Ligation Temporal Artery; Lower Extremity Blood Vessel; Upper Extremity Blood Vessel
Misc,Blood Vessel Repair,1),Surgical_Misc_BloodVesselRepair01_cbo,Finger Blood Vessel; Hand Blood Vessel; Ligation Major Artery Extremity Trauma; Ligation Temporal Artery; Lower Extremity Blood Vessel; Upper Extremity Blood Vessel
Misc,Amputations,2),Surgical_Misc_Amputations02_cbo,"Reimplant digit exc thumb complete amputation; Reimplant, thumb; Metacarpal w or w/o interosseous transfer; Phalanx w closure any joint; Phalanx w local flaps any joint; Foot midtarsal; Foot transmetatarsal; Toe Metatarsal; Toe Metatarsophalangeal joint; Toe Interphalangeal joint"
Misc,Amputations,1),Surgical_Misc_Amputations01_cbo,"Reimplant digit exc thumb complete amputation; Reimplant, thumb; Metacarpal w or w/o interosseous transfer; Phalanx w closure any joint; Phalanx w local flaps any joint; Foot midtarsal; Foot transmetatarsal; Toe Metatarsal; Toe Metatarsophalangeal joint; Toe Interphalangeal joint"
`;

/**
 * Generates a human-readable description from a control name string.
 * e.g., 'Procedures01_GTubeReposition_chk' becomes 'G Tube Reposition'.
 * @param controlName The raw control name.
 * @returns A formatted, readable string.
 */
const formatControlName = (controlName: string): string => {
  if (!controlName) return 'Unnamed Procedure';

  // Remove known prefixes and suffixes
  const coreName = controlName
    .replace(/^(Procedures\d{2}_|Orthopedics_|Surgical_FBID_|Surgical_Lacerations_|Surgical_QI_|Surgical_Misc_|Surgical_)/, '')
    .replace(/_chk$|_cbo$|_txt$/, '')
    .replace(/_cbo$/, ''); // Handle cases like ComboBoxEdit2cbo

  // Convert CamelCase to Title Case and replace underscores
  return coreName
    .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters
    .replace(/_/g, ' ')
    .replace(/(\d+)/g, ' $1') // Add space before numbers
    .trim();
};


export const PROCEDURES: Procedure[] = rawProcedureData
  .split('\n')
  .slice(1) // Skip header row
  .map(line => {
    // Robustly split the CSV line by the first 4 commas
    const parts = line.split(',');
    if (parts.length < 4) return null;

    const category = parts[0]?.trim() || 'General';
    const subcategory = parts[1]?.trim() || '';
    let description = parts[2]?.trim() || '';
    const controlName = parts[3]?.trim() || '';
    // Re-join the rest of the parts in case the options string contains commas
    const optionsString = parts.slice(4).join(',').trim().replace(/^"|"$/g, '');

    if (!description) {
      description = formatControlName(controlName);
    }

    const options = (optionsString && optionsString.toUpperCase() !== 'NA') 
      ? optionsString.split(';').map(o => o.trim()).filter(o => o)
      : [];

    return { category, subcategory, description, controlName, options };
  })
  .filter((p): p is Procedure => p !== null) // Filter out any malformed lines
  .filter(p => p.controlName !== 'Procedures02_ProceduralSedationDuration_txt'); // Filter out standalone duration
