import { useEffect, useRef, useState } from "react";

function WebcamFeed({ onSignals }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    let intervalId;
    let mounted = true;

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        setCameraActive(true);

        intervalId = window.setInterval(() => {
          const video = videoRef.current;
          const faceVisible = Boolean(video?.videoWidth && video?.videoHeight);

          onSignals?.({
            cameraActive: true,
            faceVisible,
            lookingAwayEvents: 0,
            headMovementEvents: 0,
          });
        }, 1500);
      } catch (err) {
        setCameraError("Camera unavailable");
        onSignals?.({
          cameraActive: false,
          faceVisible: false,
          lookingAwayEvents: 0,
          headMovementEvents: 0,
        });
      }
    };

    startWebcam();

    return () => {
      mounted = false;
      if (intervalId) window.clearInterval(intervalId);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [onSignals]);

  return (
    <div className="w-full">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="h-40 w-full rounded-lg border border-slate-600 object-cover"
      />
      <p className="mt-3 text-center text-sm text-gray-400">
        {cameraError || (cameraActive ? "Camera active" : "Starting camera...")}
      </p>
    </div>
  );
}

export default WebcamFeed;
