import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StepIndicator } from "@/components/caregiver/StepIndicator";
import { CaregiverStepOne } from "@/components/caregiver/CaregiverStepOne";
import { CaregiverStepTwo } from "@/components/caregiver/CaregiverStepTwo";
import { CaregiverStepThree } from "@/components/caregiver/CaregiverStepThree";
import { authApi, spacesApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { Province } from "@/types";

interface FormData {
  // Step 1
  name: string;
  email: string;
  phone: string;
  bio: string;
  // Step 2
  province: string;
  canton: string;
  locationName: string;
  coordinates: { lat: number; lng: number } | null;
  // Step 3
  spaceTitle: string;
  spaceDescription: string;
  pricePerNight: number;
  pricePerHour: number;
  minHours: number;
  acceptedPetTypes: string[];
  acceptedPetSizes: string[];
  maxPets: number;
  amenities: string[];
  photos: string[];
}

export default function BecomeCaregiverPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    bio: "",
    province: "",
    canton: "",
    locationName: "",
    coordinates: null,
    spaceTitle: "",
    spaceDescription: "",
    pricePerNight: 0,
    pricePerHour: 0,
    minHours: 2,
    acceptedPetTypes: [],
    acceptedPetSizes: [],
    maxPets: 3,
    amenities: [],
    photos: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const user = await authApi.getCurrentUser();
        if (cancelled) return;
        setFormData((prev) => ({
          ...prev,
          name: prev.name || user.name,
          email: prev.email || user.email,
          phone: prev.phone || user.phone || "",
          province: prev.province || user.province,
          canton: prev.canton || user.canton,
        }));
      } catch {
        // Esta pantalla puede abrirse sin sesion; el submit validara el acceso.
      }
    }

    void loadCurrentUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStepTwoChange = (field: string, value: any) => {
    setFormData((prev) => {
      if (field === "province") {
        return {
          ...prev,
          province: value,
          canton: "",
          locationName: "",
          coordinates: null,
        };
      }

      return { ...prev, [field]: value };
    });
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await authApi.updateProfile({
        name: formData.name,
        bio: formData.bio,
        phone: formData.phone,
        role: "both",
      });

      await spacesApi.create({
        caregiverId: "",
        title: formData.spaceTitle,
        description: formData.spaceDescription,
        photos: formData.photos,
        province: (formData.province || "San José") as Province,
        canton: formData.canton || "San José",
        address: formData.locationName,
        latitude: formData.coordinates?.lat ?? 9.7489,
        longitude: formData.coordinates?.lng ?? -83.7534,
        pricePerNight: formData.pricePerNight,
        pricePerHour: formData.pricePerHour,
        minHours: formData.minHours,
        acceptedPetTypes: formData.acceptedPetTypes as import("@/types").PetType[],
        acceptedPetSizes: formData.acceptedPetSizes as import("@/types").PetSize[],
        maxPets: formData.maxPets,
        amenities: formData.amenities,
        isActive: true,
      });

      toast({
        title: "Perfil de cuidador creado",
        description: "Tu espacio inicial ya fue registrado en Donver.",
      });
      navigate("/caregiver/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Intenta nuevamente en unos minutos.";

      toast({
        title: "No se pudo completar el registro de cuidador",
        description: message,
        variant: "destructive",
      });

      if (message.includes("iniciar sesion")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center justify-center gap-2 mb-8 font-heading font-bold text-primary"
          >
            <PawPrint className="w-8 h-8" />
            <span className="text-2xl">Donver</span>
          </Link>

          {/* Card */}
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Conviértete en Cuidador
              </h1>
              <p className="text-muted-foreground mt-2">
                Comparte tu amor por los animales y gana dinero extra
              </p>
            </div>

            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} totalSteps={3} />

            {/* Form Steps */}
            <div className="max-w-lg mx-auto">
              {currentStep === 1 && (
                <CaregiverStepOne
                  formData={{
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    bio: formData.bio,
                  }}
                  onChange={handleChange}
                  onNext={handleNext}
                />
              )}

              {currentStep === 2 && (
                <CaregiverStepTwo
                  formData={{
                    province: formData.province,
                    canton: formData.canton,
                    locationName: formData.locationName,
                    coordinates: formData.coordinates,
                  }}
                  onChange={handleStepTwoChange}
                  onBack={handleBack}
                  onNext={handleNext}
                />
              )}

              {currentStep === 3 && (
                <CaregiverStepThree
                  formData={{
                    spaceTitle: formData.spaceTitle,
                    spaceDescription: formData.spaceDescription,
                    pricePerNight: formData.pricePerNight,
                    pricePerHour: formData.pricePerHour,
                    minHours: formData.minHours,
                    acceptedPetTypes: formData.acceptedPetTypes,
                    acceptedPetSizes: formData.acceptedPetSizes,
                    maxPets: formData.maxPets,
                    amenities: formData.amenities,
                    photos: formData.photos,
                  }}
                  onChange={handleChange}
                  onBack={handleBack}
                  onSubmit={() => void handleSubmit()}
                  isSubmitting={loading}
                />
              )}
            </div>
          </div>

          {/* Help Text */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            ¿Preguntas?{" "}
            <a href="#" className="text-primary hover:underline">
              Contacta nuestro equipo de soporte
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
