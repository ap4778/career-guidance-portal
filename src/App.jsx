import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Toast from "./components/Toast.jsx";
import Modal from "./components/Modal.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CareerGuidance from "./pages/CareerGuidance.jsx";
import JobPortal from "./pages/JobPortal.jsx";
import ResumeBuilder from "./pages/ResumeBuilder.jsx";
import SkillsRoadmap from "./pages/SkillsRoadmap.jsx";
import AccountAccess from "./pages/AccountAccess.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AccountSettings from "./pages/AccountSettings.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { api } from "./services/api.js";
import { getJobMatch } from "./utils/jobMatcher.js";
import "./styles/global.css";

const blankProfile = { name: "", email: "", skills: [], interests: [], education: "Bachelor's degree", experience: "Entry", qualifications: "", preferred_location: "", preferred_career_id: null, profile_completion: 0 };
const blankResume = () => ({ name: "", email: "", phone: "", location: "", website: "", summary: "", education: [{ id: `${Date.now()}-education`, school: "", degree: "", year: "" }], skills: [], projects: [{ id: `${Date.now()}-project`, name: "", description: "" }], experience: "" });

function AccountRoot() {
  const { user, loading: authLoading, error: authError, login, register, logout } = useAuth();
  const [notice, setNotice] = useState("");
  const [authDark, setAuthDark] = useLocalStorage("careerpath-auth-dark", false);
  const notify = useCallback((message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }, []);

  if (authLoading) return <main className="api-state"><p role="status">Connecting to CareerPath…</p></main>;
  if (!user) {
    return <div className={authDark ? "dark-mode" : ""}>
      <AccountAccess onLogin={login} onRegister={register} notify={notify} dark={authDark} onThemeToggle={() => setAuthDark(!authDark)} connectionError={authError} />
      <Toast message={notice} onClose={() => setNotice("")} />
    </div>;
  }

  return <><Workspace key={user.id} user={user} onSignOut={logout} notify={notify} /><Toast message={notice} onClose={() => setNotice("")} /></>;
}

function Workspace({ user, onSignOut, notify }) {
  const [profile, setProfile] = useState({ ...blankProfile, name: user.name, email: user.email });
  const [careers, setCareers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [resume, setResume] = useState(blankResume);
  const [savedGuidance, setSavedGuidance] = useState(null);
  const [dark, setDark] = useLocalStorage("careerpath-dark-mode", false);
  const [toast, setToast] = useState("");
  const [requestError, setRequestError] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [jobToOpen, setJobToOpen] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const profileTimer = useRef(null);
  const resumeTimer = useRef(null);
  const profileRef = useRef(profile);
  const resumeRef = useRef(resume);
  const resumeIdRef = useRef(activeResumeId);
  const showToast = (message) => { setToast(message); window.setTimeout(() => setToast(""), 3200); };

  useEffect(() => {
    let cancelled = false;
    async function loadWorkspace() {
      setDataLoading(true);
      setRequestError("");
      try {
        const [profileData, careerData, skillData, jobData, savedData, applicationData, roadmapData, resumeData, assessmentData] = await Promise.all([
          api("/profile"),
          api("/careers"),
          api("/skills"),
          api("/jobs?limit=50"),
          api("/saved-jobs"),
          api("/applications?limit=50"),
          api("/roadmaps"),
          api("/resumes"),
          api("/careers/assessments?limit=1"),
        ]);
        if (cancelled) return;
        const loadedProfile = { ...blankProfile, ...profileData.profile, preferred_location: profileData.profile.preferred_location || "" };
        setProfile(loadedProfile);
        profileRef.current = loadedProfile;
        setCareers(careerData.careers);
        setSkills(skillData.skills.map((skill) => skill.name));
        setJobs(jobData.items);
        const latestAssessment = assessmentData.items[0];
        if (latestAssessment) {
          setSavedGuidance({
            inputs: latestAssessment.inputs,
            results: latestAssessment.recommendations
              .map((recommendation) => {
                const career = careerData.careers.find((item) => item.id === String(recommendation.id));
                return career ? { ...career, ...recommendation } : null;
              })
              .filter(Boolean)
              .sort((first, second) => second.score - first.score),
          });
        }
        setSavedJobs(savedData.jobs.map((job) => job.id));
        setApplications(applicationData.items);
        setRoadmaps(roadmapData.roadmaps);
        let userResumes = resumeData.resumes;
        if (!userResumes.length) {
          const created = await api("/resumes", { method: "POST", body: { title: "My resume", content: blankResume() } });
          userResumes = [created.resume];
        }
        if (cancelled) return;
        setResumes(userResumes);
        setActiveResumeId(userResumes[0].id);
        setResume(userResumes[0].content);
        resumeRef.current = userResumes[0].content;
        resumeIdRef.current = userResumes[0].id;
        setLoaded(true);
      } catch (error) {
        if (!cancelled) setRequestError(error.message || "Could not load your workspace from the API.");
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }
    loadWorkspace();
    return () => {
      cancelled = true;
      if (profileTimer.current) window.clearTimeout(profileTimer.current);
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    };
  }, []);

  const updateProfile = (nextValue) => {
    const nextProfile = typeof nextValue === "function" ? nextValue(profileRef.current) : nextValue;
    profileRef.current = nextProfile;
    setProfile(nextProfile);
    if (!loaded) return;
    if (profileTimer.current) window.clearTimeout(profileTimer.current);
    profileTimer.current = window.setTimeout(async () => {
      try {
        const response = await api("/profile", { method: "PUT", body: {
          name: nextProfile.name,
          email: nextProfile.email,
          education: nextProfile.education,
          experience: nextProfile.experience,
          qualifications: nextProfile.qualifications,
          preferredCareerId: nextProfile.preferred_career_id || null,
          preferredLocation: nextProfile.preferred_location || null,
          skills: nextProfile.skills,
          interests: nextProfile.interests,
        } });
        setProfile((current) => ({ ...current, ...response.profile }));
        showToast("Profile saved.");
      } catch (error) {
        setRequestError(error.message);
      }
    }, 500);
  };

  const changeSavedJob = async (job) => {
    const wasSaved = savedJobs.includes(job.id);
    setSavedJobs((current) => wasSaved ? current.filter((id) => id !== job.id) : [...current, job.id]);
    try {
      await api(`/saved-jobs/${job.id}`, { method: wasSaved ? "DELETE" : "POST" });
      showToast(wasSaved ? "Removed from saved jobs." : "Job saved to your shortlist.");
    } catch (error) {
      setSavedJobs((current) => wasSaved ? [...current, job.id] : current.filter((id) => id !== job.id));
      setRequestError(error.message);
    }
  };

  const applyForJob = async (job) => {
    if (applications.some((item) => String(item.jobId) === String(job.id))) {
      showToast("This job is already in your application tracker.");
      return;
    }
    try {
      const application = await api("/applications", { method: "POST", body: { jobId: job.id } });
      setApplications((current) => [{ ...application, job: { ...job } }, ...current]);
      showToast("Application added to your tracker.");
    } catch (error) {
      setRequestError(error.message);
    }
  };

  const removeApplication = async (application) => {
    try {
      await api(`/applications/${application.id}`, { method: "DELETE" });
      setApplications((current) => current.filter((item) => item.id !== application.id));
      showToast("Application removed from your tracker.");
    } catch (error) {
      setRequestError(error.message);
    }
  };

  const toggleRoadmapStep = async (roadmap, step) => {
    const complete = !step.complete;
    setRoadmaps((current) => current.map((item) => item.id !== roadmap.id ? item : ({
      ...item,
      phases: item.phases.map((phase) => ({ ...phase, topics: phase.topics.map((topic) => topic.id === step.id ? { ...topic, complete } : topic) })),
    })));
    try {
      await api(`/roadmaps/${roadmap.id}/steps/${step.id}`, { method: "PATCH", body: { complete } });
    } catch (error) {
      setRequestError(error.message);
      setRoadmaps((current) => current.map((item) => item.id !== roadmap.id ? item : ({
        ...item,
        phases: item.phases.map((phase) => ({ ...phase, topics: phase.topics.map((topic) => topic.id === step.id ? { ...topic, complete: !complete } : topic) })),
      })));
    }
  };

  const selectResume = (selectedId) => {
    const selected = resumes.find((item) => item.id === selectedId);
    if (!selected) return;
    setActiveResumeId(selected.id);
    resumeIdRef.current = selected.id;
    setResume(selected.content);
    resumeRef.current = selected.content;
  };

  const createResume = async () => {
    try {
      const created = await api("/resumes", { method: "POST", body: { title: `Resume ${resumes.length + 1}`, content: blankResume() } });
      setResumes((current) => [created.resume, ...current]);
      setActiveResumeId(created.resume.id);
      resumeIdRef.current = created.resume.id;
      setResume(created.resume.content);
      resumeRef.current = created.resume.content;
      showToast("New resume created.");
    } catch (error) {
      setRequestError(error.message);
    }
  };

  const deleteResume = async () => {
    if (!activeResumeId) return;
    if (resumeTimer.current) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
    try {
      await api(`/resumes/${activeResumeId}`, { method: "DELETE" });
      const remaining = resumes.filter((item) => item.id !== activeResumeId);
      if (remaining.length) {
        setResumes(remaining);
        selectResume(remaining[0].id);
      } else {
        const created = await api("/resumes", { method: "POST", body: { title: "My resume", content: blankResume() } });
        setResumes([created.resume]);
        setActiveResumeId(created.resume.id);
        resumeIdRef.current = created.resume.id;
        setResume(created.resume.content);
        resumeRef.current = created.resume.content;
      }
      showToast("Resume deleted.");
    } catch (error) {
      setRequestError(error.message);
    }
  };

  const updateResume = (nextValue) => {
    const nextResume = typeof nextValue === "function" ? nextValue(resumeRef.current) : nextValue;
    resumeRef.current = nextResume;
    setResume(nextResume);
    if (!loaded || !resumeIdRef.current) return;
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    const resumeId = resumeIdRef.current;
    resumeTimer.current = window.setTimeout(async () => {
      try {
        await api(`/resumes/${resumeId}`, { method: "PUT", body: { content: nextResume } });
        setResumes((current) => current.map((item) => item.id === resumeId ? { ...item, content: nextResume } : item));
      } catch (error) {
        setRequestError(error.message);
      }
    }, 700);
  };

  if (dataLoading) return <main className="api-state"><p role="status">Loading your secure workspace…</p></main>;
  if (requestError && !loaded) return <main className="api-state"><section className="panel"><p className="eyebrow">API CONNECTION</p><h1>Could not load your workspace</h1><p>{requestError}</p><p>Start the Express API, configure MySQL, and run the seed command, then reload.</p></section></main>;

  return <div className={`app-shell ${dark ? "dark-mode" : ""}`}>
    <Navbar dark={dark} onThemeToggle={() => setDark(!dark)} account={{ ...user, ...profile }} onSignOut={() => onSignOut().catch((error) => setRequestError(error.message))} />
    <main className="main-area">
      {requestError && <p className="cloud-save-error" role="alert">{requestError}<button type="button" className="text-button" onClick={() => setRequestError("")}>Dismiss</button></p>}
      <Routes>
        <Route path="/" element={<Dashboard profile={profile} setProfile={updateProfile} applications={applications} savedJobs={savedJobs} roadmaps={roadmaps} jobs={jobs} savedGuidance={savedGuidance} onSaveJob={changeSavedJob} onJobDetails={setJobToOpen} />} />
        <Route path="/guidance" element={<CareerGuidance profile={profile} setProfile={updateProfile} savedGuidance={savedGuidance} setSavedGuidance={setSavedGuidance} careers={careers} skills={skills} notify={showToast} />} />
        <Route path="/jobs" element={<JobPortal profile={profile} jobs={jobs} careers={careers} savedJobs={savedJobs} applications={applications} onToggleSaved={changeSavedJob} onApply={applyForJob} onRemoveApplication={removeApplication} notify={showToast} />} />
        <Route path="/resume" element={<ResumeBuilder resume={resume} resumes={resumes} activeResumeId={activeResumeId} skills={skills} setResume={updateResume} onSelectResume={selectResume} onCreateResume={createResume} onDeleteResume={deleteResume} notify={showToast} />} />
        <Route path="/roadmap" element={<SkillsRoadmap profile={profile} roadmaps={roadmaps} careers={careers} onToggleStep={toggleRoadmapStep} />} />
        <Route path="/account" element={<AccountSettings profile={profile} setProfile={updateProfile} careers={careers} skills={skills} notify={showToast} />} />
        <Route path="/admin" element={user.role === "admin" ? <AdminDashboard careers={careers} /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
    <Toast message={toast} onClose={() => setToast("")} />
    <div className="dashboard-job-modal-mount">
      {jobToOpen && <Modal open onClose={() => setJobToOpen(null)} title={jobToOpen.title}><div className="job-modal-details"><p className="job-company">{jobToOpen.company} · {jobToOpen.location}</p><p>{jobToOpen.description}</p><p><strong>{jobToOpen.salary}</strong> · {jobToOpen.type}{getJobMatch(jobToOpen, profile.skills) > 0 && ` · ${getJobMatch(jobToOpen, profile.skills)}% match`}</p><div className="job-skill-tags">{jobToOpen.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><button className="button button-primary apply-button" onClick={() => { applyForJob(jobToOpen); setJobToOpen(null); }}>Apply and track</button></div></Modal>}
    </div>
  </div>;
}

export default function App() {
  return <AuthProvider><BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AccountRoot /></BrowserRouter></AuthProvider>;
}
