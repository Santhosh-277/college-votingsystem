import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerStudent, loginStudent, studentExists, getAllStudents } from '@/integrations/firebase/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';
import { Vote, Loader, ArrowLeft, Camera, UserCheck } from 'lucide-react';

declare global {
  interface Window {
    faceapi: any;
  }
}

const Auth = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [rollNo, setRollNo] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');


  // Face Recognition State
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceData, setFaceData] = useState<string | null>(null);
  const [verifyingFace, setVerifyingFace] = useState(false);
  const [captureStep, setCaptureStep] = useState<'details' | 'face'>('details');
  const [verificationStep, setVerificationStep] = useState<'credentials' | 'face'>('credentials');
  const [tempStudent, setTempStudent] = useState<any>(null);
  const [detectionTimer, setDetectionTimer] = useState<any>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        await Promise.all([
          window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        console.log('Face-api models loaded');
      } catch (error) {
        console.error('Error loading face-api models:', error);
        toast.error('Could not load face recognition models. Please check your network and try again.');
      }
    };

    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const waitForFaceApi = () => {
      if (window.faceapi) {
        loadModels();
      } else {
        retryTimer = setTimeout(waitForFaceApi, 500);
      }
    };

    waitForFaceApi();

    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, []);

  const startCamera = async () => {
    if (!modelsLoaded) {
      toast.warning('Face API models not loaded yet. Please wait a moment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure the video starts playing
        await videoRef.current.play().catch(e => console.error("Error playing video:", e));

        // Start detection loop for visual feedback
        const timer = setInterval(async () => {
          if (videoRef.current && canvasRef.current && modelsLoaded) {
            const displaySize = {
              width: videoRef.current.offsetWidth || 640,
              height: videoRef.current.offsetHeight || 480
            };
            window.faceapi.matchDimensions(canvasRef.current, displaySize);

            const detections = await window.faceapi.detectAllFaces(
              videoRef.current,
              new window.faceapi.SsdMobilenetv1Options()
            ).withFaceLandmarks();

            const resizedDetections = window.faceapi.resizeResults(detections, displaySize);
            const context = canvasRef.current.getContext('2d');
            if (context) {
              context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              window.faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
              window.faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
            }
          }
        }, 200);
        setDetectionTimer(timer);
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      toast.error('Could not access camera');
    }
  };

  const stopCamera = () => {
    if (detectionTimer) {
      clearInterval(detectionTimer);
      setDetectionTimer(null);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
  };

  // Lifecycle management for camera
  useEffect(() => {
    const isCameraNeeded = 
      (activeTab === 'signin' && verificationStep === 'face') || 
      (activeTab === 'signup' && captureStep === 'face');

    if (isCameraNeeded) {
      // Small delay to ensure the video element is rendered and Ref is populated
      const timer = setTimeout(() => {
        startCamera();
      }, 100);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [activeTab, captureStep, verificationStep, modelsLoaded]);

  const captureFace = async () => {
    if (!videoRef.current) {
      toast.error('Camera feed is not available. Please enable camera and try again.');
      return;
    }
    if (!modelsLoaded) {
      toast.warning('Face recognition models are still loading. Please wait a moment.');
      return;
    }

    setIsCapturing(true);
    const detections = await window.faceapi.detectSingleFace(
      videoRef.current,
      new window.faceapi.SsdMobilenetv1Options()
    ).withFaceLandmarks().withFaceDescriptor();

    if (detections) {
      const descriptor = Array.from(detections.descriptor).join(',');
      setFaceData(descriptor);
      toast.success('Face captured successfully!');
      setCaptureStep('details');
    } else {
      toast.error('No face detected. Please try again.');
    }
    setIsCapturing(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const student = await loginStudent(rollNo, password);

      if (student) {
        if (student.faceData) {
          setTempStudent(student);
          setVerificationStep('face');
        } else {
          toast.success('Signed in successfully');
          const sessionData = { id: student.id, rollNo: student.rollNo, name: student.name, role: 'student' };
          localStorage.setItem('studentSession', JSON.stringify(sessionData));
          window.dispatchEvent(new Event('studentSessionCreated'));
          setTimeout(() => navigate('/dashboard'), 100);
        }
      } else {
        toast.error('Invalid roll number or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during sign in');
    }

    setLoading(false);
  };

  const verifyFaceAndLogin = async () => {
    if (!videoRef.current) {
      toast.error('Camera feed is not available. Please enable camera and try again.');
      return;
    }
    if (!tempStudent || !tempStudent.faceData) {
      toast.error('No student data available for face verification. Please login again.');
      return;
    }
    if (!modelsLoaded) {
      toast.warning('Face recognition models are still loading. Please wait a moment.');
      return;
    }

    setVerifyingFace(true);
    const detections = await window.faceapi.detectSingleFace(
      videoRef.current,
      new window.faceapi.SsdMobilenetv1Options()
    ).withFaceLandmarks().withFaceDescriptor();

    if (detections) {
      const storedDescriptor = new Float32Array(tempStudent.faceData.split(',').map(Number));
      const distance = window.faceapi.euclideanDistance(detections.descriptor, storedDescriptor);

      console.log('Face Match Distance:', distance);

      if (distance < 0.55) { // Slightly relaxed threshold for better reliability
        toast.success('Face verified! Signing in...');
        const sessionData = { id: tempStudent.id, rollNo: tempStudent.rollNo, name: tempStudent.name, role: 'student' };
        localStorage.setItem('studentSession', JSON.stringify(sessionData));
        window.dispatchEvent(new Event('studentSessionCreated'));
        setTimeout(() => navigate('/dashboard'), 100);
      } else {
        toast.error('Face verification failed. Please try again.');
      }
    } else {
      toast.error('No face detected. Please ensure you are visible to the camera.');
    }
    setVerifyingFace(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo || !password || !name) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!faceData) {
      toast.warning('Biometric authentication is required. Please capture your face.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const exists = await studentExists(rollNo);
      if (exists) {
        toast.error('Roll number already registered');
        setLoading(false);
        return;
      }

      // Check if face is already registered with another roll number
      const allStudents = await getAllStudents();
      const currentDescriptor = new Float32Array(faceData.split(',').map(Number));
      
      const duplicateStudent = allStudents.find(student => {
        if (!student.faceData) return false;
        const storedDescriptor = new Float32Array(student.faceData.split(',').map(Number));
        const distance = window.faceapi.euclideanDistance(currentDescriptor, storedDescriptor);
        return distance < 0.55; // Using the same threshold as login verification
      });

      if (duplicateStudent) {
        toast.error('This face is already registered with another roll number');
        setLoading(false);
        return;
      }

      await registerStudent(rollNo, password, name, email, faceData);
      toast.success('Account created successfully! You can now sign in.');
      setRollNo('');
      setPassword('');
      setName('');
      setEmail('');
      setFaceData(null);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to create account');
    }

    setLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2">
            <Vote className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">College Voting System</CardTitle>
          <CardDescription>Cast your vote securely and transparently</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-4">
              {verificationStep === 'credentials' ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-rollno">Roll Number</Label>
                    <Input
                      id="signin-rollno"
                      type="text"
                      placeholder="e.g., 2024001"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <UserCheck className="w-12 h-12 text-primary mx-auto" />
                    <h3 className="text-lg font-semibold">Face Verification</h3>
                    <p className="text-sm text-gray-500">Please look at the camera to verify your identity</p>
                  </div>

                  <div className="relative bg-black rounded-lg overflow-hidden h-64">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
                    />
                    {verifyingFace && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setVerificationStep('credentials');
                      }}
                      disabled={verifyingFace}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={verifyFaceAndLogin}
                      disabled={verifyingFace || !modelsLoaded}
                    >
                      {verifyingFace ? 'Verifying...' : 'Verify Face'}
                    </Button>
                  </div>
                </div>
              )}
              
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              {captureStep === 'details' ? (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email Address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-rollno">Roll Number</Label>
                    <Input
                      id="signup-rollno"
                      type="text"
                      placeholder="e.g., 2024001"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500">Minimum 6 characters</p>
                  </div>

                  <div className="p-4 border-2 border-dashed rounded-lg text-center space-y-2">
                    {faceData ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <UserCheck className="w-5 h-5" />
                        <span className="font-semibold">Face data captured</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-8 px-2"
                          onClick={() => {
                            setFaceData(null);
                            setCaptureStep('face');
                          }}
                        >
                          Retake
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="text-sm font-medium">Biometric Setup Required</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCaptureStep('face');
                          }}
                        >
                          Capture Face
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || !faceData}>
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Sign Up'
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <Camera className="w-12 h-12 text-primary mx-auto" />
                    <h3 className="text-lg font-semibold">Face Capture</h3>
                    <p className="text-sm text-gray-500">Please center your face in the frame</p>
                  </div>

                  <div className="relative bg-black rounded-lg overflow-hidden h-64">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
                    />
                    {isCapturing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setCaptureStep('details');
                      }}
                      disabled={isCapturing}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={captureFace}
                      disabled={isCapturing || !modelsLoaded}
                    >
                      {isCapturing ? 'Capturing...' : 'Capture'}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
