import React, { useState, useRef, useEffect } from "react";
import { Modal } from "../shared/common/Modal";
import { Button } from "../shared/common/Button";
import { storage } from "../../utils/storage";
import { getBPLevel } from "../../utils/health";
import toast from "react-hot-toast";
import { FormSelect } from "../shared/common/custom-dropdown";
import { FormInput } from "../shared/common/custom-input";

export const BPDetectionModal = ({ isOpen, onClose, onResult }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    diet: "",
    salt_intake: "",
    exercise: "",
    smoker: "", // 👈 was 'no '
    alcohol: "no", // 👈 was ' no'
    prev_conditions: "normal",
    height: "",
    weight: "",
    cholesterol: 1,
    gluc: 1,
  });

  const [showCamera, setShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && showCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, showCamera]);

  const startCamera = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied");
      toast.error("Camera access denied");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const ctx = canvasRef.current.getContext("2d");
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    return canvasRef.current.toDataURL("image/jpeg", 0.8);
  };

  const detectBP = async () => {
    if (!cameraReady) {
      toast.error("Camera not ready");
      return;
    }

    setIsLoading(true);
    const frameData = captureFrame();
    const base64Image = frameData?.split(",")[1];
    if (!base64Image) {
      toast.error("Image capture failed");
      return;
    }

    try {
      toast.loading("Analyzing...");

      const payload = {
        ...formData,
        prev_conditions: [formData.prev_conditions],
        image_data: base64Image,
        age: Number(formData.age),
        height: Number(formData.height),
        weight: Number(formData.weight),
      };
      console.log("Payload:", payload);

      const response = await fetch(
        "https://ahmadraza161-bp-fuel-12.hf.space/predict_health",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Prediction failed");

      console.log("Prediction result:", result);

      const now = new Date();
      const reading = {
        id: Date.now().toString(),
        systolic: result.systolic_bp,
        diastolic: result.diastolic_bp,
        pulse: result.pulse || Math.floor(Math.random() * (100 - 60) + 60),
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0].slice(0, 5),
        level: getBPLevel(result.systolic_bp, result.diastolic_bp).level,
        capturedImage: frameData,
      };

      storage.addBPReading(reading);
      stopCamera();
      onClose();
      onResult({
        reading,
        bpLevel: getBPLevel(result.systolic_bp, result.diastolic_bp),
      });

      toast.dismiss();
      toast.success("Prediction complete!");
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.age || !formData.height || !formData.weight) {
      toast.error("Please fill all fields");
      return;
    }
    setShowCamera(true);
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClose = () => {
    stopCamera();
    setShowCamera(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Blood Pressure Detection"
    >
      {!showCamera ? (
        <div className="mx-auto max-w-3/2 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Health Information
          </h2>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Age"
                name="age"
                type="number"
                placeholder="Age"
                value={formData.age}
                onChange={handleFormChange}
              />
              <FormSelect
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={(value) => handleSelectChange("gender", value)}
                placeholder="Select Gender"
                options={["Male", "Female"]}
              />
              <FormSelect
                label="Diet"
                name="diet"
                value={formData.diet}
                onChange={(value) => handleSelectChange("diet", value)}
                placeholder="Select Diet"
                options={["Healthy", "Average", "Poor"]}
              />
              <FormSelect
                label="Salt Intake"
                name="salt_intake"
                value={formData.salt_intake}
                onChange={(value) => handleSelectChange("salt_intake", value)}
                placeholder="Select Salt Intake"
                options={["Low", "Moderate", "High"]}
              />
              <FormSelect
                label="Exercise"
                name="exercise"
                value={formData.exercise}
                onChange={(value) => handleSelectChange("exercise", value)}
                placeholder="Select Exercise Level"
                options={["Often", "Rarely", "Never"]}
              />
              <FormSelect
                label="Smoker"
                name="smoker"
                value={formData.smoker}
                onChange={(value) => handleSelectChange("smoker", value)}
                placeholder="Are you a Smoker?"
                options={["No", "Yes"]}
              />
           
              <FormInput
                label="Height (cm)"
                name="height"
                type="number"
                placeholder="Height (cm)"
                value={formData.height}
                onChange={handleFormChange}
              />
              <FormInput
                label="Weight (kg)"
                name="weight"
                type="number"
                placeholder="Weight (kg)"
                value={formData.weight}
                onChange={handleFormChange}
              />
            </div>
            <Button type="submit" className="w-full">
              Proceed to Camera
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white">
                Starting camera...
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex justify-between">
            <Button onClick={detectBP} disabled={isLoading || !cameraReady}>
              {isLoading ? "Detecting..." : "Detect BP"}
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
