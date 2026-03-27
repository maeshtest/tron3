import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Upload, AlertCircle, CheckCircle2, X, ChevronRight, ChevronLeft, User, FileText, Camera, Lock } from "lucide-react";
import { useState, useRef, ChangeEvent } from "react";

type KYCStatus = "unverified" | "pending" | "verified" | "rejected";
type Step = 1 | 2 | 3;

const KYCPage = () => {
  // Status stored in localStorage for demo persistence
  const [status, setStatus] = useState<KYCStatus>(() => {
    const saved = localStorage.getItem("kyc_status");
    return (saved as KYCStatus) || "unverified";
  });
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  // Personal info
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");

  // Document upload
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selfie upload
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: "id" | "selfie") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation: size < 10MB, image/pdf
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, PNG, PDF are allowed");
      return;
    }

    if (type === "id") {
      setIdFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setIdPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setIdPreview(null);
      }
    } else {
      setSelfieFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setSelfiePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setSelfiePreview(null);
      }
    }
  };

  const removeFile = (type: "id" | "selfie") => {
    if (type === "id") {
      setIdFile(null);
      setIdPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setSelfieFile(null);
      setSelfiePreview(null);
      if (selfieInputRef.current) selfieInputRef.current.value = "";
    }
  };

  const validateStep1 = () => {
    if (!fullName.trim()) return "Full name is required";
    if (!dateOfBirth) return "Date of birth is required";
    if (!address.trim()) return "Address is required";
    if (!country.trim()) return "Country is required";
    return null;
  };

  const validateStep2 = () => {
    if (!idFile) return "Please upload an ID document";
    return null;
  };

  const validateStep3 = () => {
    if (!selfieFile) return "Please upload a selfie with your ID";
    return null;
  };

  const nextStep = () => {
    if (step === 1) {
      const error = validateStep1();
      if (error) {
        alert(error);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const error = validateStep2();
      if (error) {
        alert(error);
        return;
      }
      setStep(3);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const submitKYC = async () => {
    const error = validateStep3();
    if (error) {
      alert(error);
      return;
    }

    setSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Save to localStorage and update state
    localStorage.setItem("kyc_status", "pending");
    setStatus("pending");
    setSubmitting(false);
    // Optionally reset form or keep data
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step >= s
                ? "bg-primary text-white"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {s === 1 ? "Personal" : s === 2 ? "ID Document" : "Selfie"}
          </span>
        </div>
      ))}
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-foreground mb-2">
        <User className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Personal Information</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="As on ID"
            className="w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Date of Birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={e => setDateOfBirth(e.target.value)}
            className="w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">Residential Address</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Street, city, postal code"
            className="w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">Country</label>
          <input
            type="text"
            value={country}
            onChange={e => setCountry(e.target.value)}
            placeholder="Country of residence"
            className="w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>
  );

  const renderDocumentUpload = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-foreground mb-2">
        <FileText className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">ID Document</h2>
      </div>
      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
        {!idFile ? (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium mb-1">Upload your ID</p>
            <p className="text-xs text-muted-foreground mb-4">Passport, national ID, or driver's license</p>
            <Button
              variant="goldOutline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => handleFileChange(e, "id")}
              accept="image/jpeg,image/png,application/pdf"
              className="hidden"
            />
          </>
        ) : (
          <div className="relative">
            {idPreview ? (
              <img src={idPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg border border-border" />
            ) : (
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-sm text-foreground">{idFile.name}</p>
                <p className="text-xs text-muted-foreground">{(idFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
            <button
              onClick={() => removeFile("id")}
              className="absolute top-2 right-2 p-1 bg-destructive/90 rounded-full hover:bg-destructive text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        Supported formats: JPG, PNG, PDF. Max 10MB.
      </p>
    </div>
  );

  const renderSelfieUpload = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-foreground mb-2">
        <Camera className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Selfie with ID</h2>
      </div>
      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
        {!selfieFile ? (
          <>
            <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium mb-1">Take a selfie holding your ID</p>
            <p className="text-xs text-muted-foreground mb-4">Make sure your face and ID are clearly visible</p>
            <Button
              variant="goldOutline"
              size="sm"
              onClick={() => selfieInputRef.current?.click()}
            >
              Take Photo / Upload
            </Button>
            <input
              type="file"
              ref={selfieInputRef}
              onChange={e => handleFileChange(e, "selfie")}
              accept="image/jpeg,image/png"
              className="hidden"
            />
          </>
        ) : (
          <div className="relative">
            {selfiePreview && (
              <img src={selfiePreview} alt="Selfie Preview" className="max-h-48 mx-auto rounded-lg border border-border" />
            )}
            <button
              onClick={() => removeFile("selfie")}
              className="absolute top-2 right-2 p-1 bg-destructive/90 rounded-full hover:bg-destructive text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        Please hold your ID next to your face and take a clear photo.
      </p>
    </div>
  );

  // Status display for already verified/pending
  const renderStatusDisplay = () => {
    if (status === "verified") {
      return (
        <div className="bg-profit/5 border border-profit/30 rounded-2xl p-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-profit mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground">Verification Complete</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your identity has been verified. You now have full access to all platform features.
          </p>
        </div>
      );
    }
    if (status === "pending") {
      return (
        <div className="bg-primary/5 border border-primary/30 rounded-2xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground">Verification Pending</h2>
          <p className="text-sm text-muted-foreground mt-1">
            We're reviewing your documents. This usually takes 1-3 business days.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            You'll receive an email once the review is complete.
          </p>
        </div>
      );
    }
    if (status === "rejected") {
      return (
        <div className="bg-loss/5 border border-loss/30 rounded-2xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-loss mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground">Verification Failed</h2>
          <p className="text-sm text-muted-foreground mt-1">
            We couldn't verify your identity with the documents provided.
          </p>
          <Button variant="gold" size="sm" className="mt-3" onClick={() => {
            localStorage.setItem("kyc_status", "unverified");
            setStatus("unverified");
            setStep(1);
            setFullName("");
            setDateOfBirth("");
            setAddress("");
            setCountry("");
            setIdFile(null);
            setIdPreview(null);
            setSelfieFile(null);
            setSelfiePreview(null);
          }}>
            Retry Verification
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Identity Verification (KYC)</h1>
          <p className="text-sm text-muted-foreground">Complete verification to unlock withdrawals, higher limits, and advanced features</p>
        </div>

        {status !== "unverified" ? (
          renderStatusDisplay()
        ) : (
          <>
            {renderStepIndicator()}

            <div className="bg-card border border-border rounded-2xl p-6">
              {step === 1 && renderPersonalInfo()}
              {step === 2 && renderDocumentUpload()}
              {step === 3 && renderSelfieUpload()}
            </div>

            <div className="flex gap-3">
              {step > 1 && (
                <Button variant="outline" size="lg" onClick={prevStep} className="flex-1 gap-1">
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
              )}
              {step < 3 ? (
                <Button variant="gold" size="lg" onClick={nextStep} className="flex-1 gap-1">
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="gold"
                  size="lg"
                  onClick={submitKYC}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? "Submitting..." : "Submit Verification"}
                </Button>
              )}
            </div>

            <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Your data is encrypted and handled securely. We follow strict privacy regulations to protect your information.
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default KYCPage;
