import React, { useState, useEffect } from "react";
import { Job } from "@/api/entities";
import { Application } from "@/api/entities";
import { PortfolioProject } from "@/api/entities";
import { User } from "@/api/entities"; // Added import for User entity
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Star,
  Brain,
  FileText,
  CheckCircle,
  ExternalLink,
  Award,
  Zap,
  Loader2,
  Target,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Copy,
  MoreVertical,
  Trash2,
  CheckCircle2,
  Briefcase,
  Edit3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { draftMaterials } from "@/api/functions";
import { rankJob } from "@/api/functions";
import { generateApplicationAnswer } from "@/api/functions";
import { curatePortfolio } from "@/api/functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { trackJobAction, trackApplicationAction, trackToolUsage, trackAIInteraction, trackEvent } from "@/components/analytics";
import UpgradePrompt from "../components/UpgradePrompt"; // Added import

export default function JobDetail() {
  const [job, setJob] = useState(null);
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRanking, setIsRanking] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  // New state variables for Application Question Answerer
  const [applicationQuestion, setApplicationQuestion] = useState("");
  const [voiceTone, setVoiceTone] = useState("professional");
  const [generatedAnswer, setGeneratedAnswer] = useState("");
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [coverLetterVoice, setCoverLetterVoice] = useState("professional");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false); // New state for application materials visibility
  const [isFindingOfficial, setIsFindingOfficial] = useState(false); // New state for official posting finder
  const [officialPostingResult, setOfficialPostingResult] = useState(null); // New state for official posting result

  // New state variables for AI Portfolio Curator
  const [showCuratePortfolioDialog, setShowCuratePortfolioDialog] = useState(false);
  const [portfolioCuration, setPortfolioCuration] = useState(null);
  const [isCuratingPortfolio, setIsCuratingPortfolio] = useState(false);
  const [portfolioProjects, setPortfolioProjects] = useState([]);

  const [user, setUser] = useState(null); // Added state for user

  const navigate = useNavigate();

  const jobId = new URLSearchParams(window.location.search).get("id");

  const loadJobDetails = React.useCallback(async () => {
    try {
      const jobData = await Job.filter({ id: jobId });
      if (jobData.length > 0) {
        setJob(jobData[0]);
      }
    } catch (error) {
      console.error("Error loading job:", error);
    }
    setIsLoading(false);
  }, [jobId]);

  const loadApplication = React.useCallback(async () => {
    try {
      const apps = await Application.filter({ job_id: jobId });
      if (apps.length > 0) {
        setApplication(apps[0]);
      }
    } catch (error) {
      console.error("Error loading application:", error);
    }
  }, [jobId]);

  const loadPortfolioProjects = React.useCallback(async () => {
    try {
      const projects = await PortfolioProject.list();
      setPortfolioProjects(projects);
    } catch (error) {
      console.error("Error loading portfolio projects:", error);
    }
  }, []);

  // Effect to load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (jobId) {
      loadJobDetails();
      loadApplication();
      loadPortfolioProjects();
    }
  }, [jobId, loadJobDetails, loadApplication, loadPortfolioProjects]);

  useEffect(() => {
    if (job) {
      trackEvent('view_job_detail', {
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        score: job.score,
        status: job.status
      });
    }
  }, [job]);

  const handleRankJob = async () => {
    if (!job) return;

    setIsRanking(true);
    trackAIInteraction('rank_job', { job_id: job.id });

    try {
      const { data } = await rankJob({ job_id: job.id });
      setJob(data.job);
      trackJobAction('ranked', data.job);
    } catch (error) {
      console.error("Error ranking job:", error);
      toast.error("Failed to rank job: " + error.message);
    }
    setIsRanking(false);
  };

  const handleDraftMaterials = async () => {
    if (!job) return;

    // Check if user has reached their limit
    if (user?.subscription_tier === 'starter' && (user?.usage_limits?.cover_letters_count || 0) >= 2) {
      toast.error("You've reached your monthly limit for cover letters");
      return;
    }

    setIsDrafting(true);
    trackAIInteraction('draft_cover_letter', {
      job_id: job.id,
      voice_tone: coverLetterVoice
    });

    try {
      const { data } = await draftMaterials({
        job_id: job.id,
        voice_tone: coverLetterVoice
      });

      if (data.usage) {
        toast.success(`Cover letter drafted! ${data.usage.used}/${data.usage.limit} used this month.`);
      } else {
        toast.success("Cover letter drafted successfully!");
      }

      setApplication(data.application);

      if (job) {
        trackApplicationAction('drafted', data.application, job);
      }
      // After successful draft, refresh user data to update usage count
      const updatedUser = await User.me();
      setUser(updatedUser);

    } catch (error) {
      console.error("Error drafting materials:", error);

      if (error.response?.data?.upgrade_required) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to draft materials: " + error.message);
      }
    }
    setIsDrafting(false);
  };

  const handleApprove = async () => {
    if (!application) return;

    try {
      const updatedApplication = await Application.update(application.id, {
        current_status: "ready_to_apply",
        status_history: [
          ...(application.status_history || []),
          {
            status: "ready_to_apply",
            date: new Date().toISOString(),
            note: "Application materials approved and ready"
          }
        ]
      });

      setApplication(prev => ({
        ...prev,
        ...updatedApplication
      }));
      toast.success("Application materials approved and ready to submit!");

      if (job) {
        trackApplicationAction('approved', updatedApplication, job);
      }
    } catch (error) {
      console.error("Error approving application:", error);
      toast.error("Error approving application: " + error.message);
    }
  };

  const handleMarkAsSubmitted = async () => {
    if (!application || !job) return;

    try {
      const updatedApplication = await Application.update(application.id, {
        current_status: "submitted",
        submitted_at: new Date().toISOString(),
        status_history: [
          ...(application.status_history || []),
          {
            status: "submitted",
            date: new Date().toISOString(),
            note: "Application submitted to employer"
          }
        ]
      });

      // Also update the job status to "applied" if it isn't already
      await Job.update(job.id, { status: "applied" });
      setJob(prev => ({ ...prev, status: "applied" }));

      setApplication(prev => ({
        ...prev,
        ...updatedApplication
      }));

      toast.success("🎉 Application marked as submitted! Good luck!");

      trackApplicationAction('submitted', updatedApplication, job);
      trackEvent('conversion', {
        conversion_type: 'application_submitted',
        job_title: job.title,
        company: job.company
      });
    } catch (error) {
      console.error("Error marking as submitted:", error);
      toast.error("Error marking as submitted: " + error.message);
    }
  };

  const handleGenerateAnswer = async () => {
    if (!applicationQuestion.trim()) {
      toast.error("Please enter an application question first");
      return;
    }
    if (!jobId) {
      toast.error("Job ID not found. Cannot generate answer.");
      return;
    }

    setIsGeneratingAnswer(true);
    setGeneratedAnswer("");

    trackToolUsage('application_question_answerer', {
      job_id: jobId,
      voice_tone: voiceTone
    });

    try {
      const { data } = await generateApplicationAnswer({
        job_id: jobId,
        question: applicationQuestion,
        voice_tone: voiceTone
      });
      setGeneratedAnswer(data.answer);
      toast.success("Answer generated successfully!");
    } catch (error) {
      console.error("Error generating answer:", error);
      toast.error("Failed to generate answer: " + error.message);
    }
    setIsGeneratingAnswer(false);
  };

  const handleCopyAnswer = () => {
    if (generatedAnswer) {
      navigator.clipboard.writeText(generatedAnswer);
      toast.success("Answer copied to clipboard!");
      trackEvent('copy_generated_answer', { job_id: jobId });
    }
  };

  const handleDeleteJob = async () => {
    if (!job) return;

    try {
      trackJobAction('deleted', job);
      await Job.delete(job.id);
      toast.success("Job deleted successfully");
      navigate(createPageUrl("RankedJobs"));
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job: " + error.message);
    }
  };

  const handleFindOfficialPosting = async () => {
    setIsFindingOfficial(true);
    setOfficialPostingResult(null);

    trackToolUsage('find_official_posting', { job_id: jobId });

    try {
      const { findOfficialPosting } = await import("@/api/functions");
      const { data } = await findOfficialPosting({ job_id: jobId });

      if (data?.result) {
        setOfficialPostingResult(data.result);

        trackEvent('official_posting_found', {
          job_id: jobId,
          confidence: data.result.confidence,
          has_url: !!data.result.official_url
        });

        if (data.result.official_url && data.result.confidence === "high") {
          toast.success("Found official posting!");
        } else if (data.result.official_url) {
          toast.info("Found a potential link - please verify");
        } else {
          toast.warning("Couldn't find the official posting");
        }
      }
    } catch (error) {
      console.error("Error finding official posting:", error);
      toast.error("Failed to find official posting: " + error.message);
    }

    setIsFindingOfficial(false);
  };

  const handleUpdateSourceUrl = async () => {
    if (!officialPostingResult?.official_url) return;

    try {
      await Job.update(jobId, { source_url: officialPostingResult.official_url });
      setJob(prev => ({ ...prev, source_url: officialPostingResult.official_url }));
      toast.success("Job link updated successfully!");

      trackEvent('source_url_updated', {
        job_id: jobId,
        source: 'ai_search'
      });

      setOfficialPostingResult(null); // Clear the result card after applying
    } catch (error) {
      console.error("Error updating job:", error);
      toast.error("Failed to update job link");
    }
  };

  const handleCuratePortfolio = async () => {
    if (!jobId) {
      toast.error("Job ID not found");
      return;
    }

    if (portfolioProjects.length === 0) {
      toast.error("Please add some projects to your portfolio first");
      return;
    }

    setIsCuratingPortfolio(true);
    trackToolUsage('curate_portfolio', { job_id: jobId });

    try {
      const { data } = await curatePortfolio({
        job_id: jobId,
        max_projects: 3
      });

      setPortfolioCuration(data);
      setShowCuratePortfolioDialog(true);
      toast.success("Portfolio curated successfully!");

      trackEvent('portfolio_curated', {
        job_id: jobId,
        projects_analyzed: data.total_projects_analyzed,
        projects_recommended: data.curation.curated_projects.length
      });
    } catch (error) {
      console.error("Error curating portfolio:", error);
      toast.error("Failed to curate portfolio: " + error.message);
    }

    setIsCuratingPortfolio(false);
  };

  if (isLoading || !job) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="h-4 bg-slate-200 rounded w-96"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-96 bg-slate-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 md:gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(createPageUrl("RankedJobs"))}
          className="hover:bg-slate-100 shrink-0 mt-1"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-3xl font-bold text-slate-900 break-words">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2 text-sm md:text-base text-slate-600">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="truncate">{job.company}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{job.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 shrink-0" />
              {job.posted_date ? format(new Date(job.posted_date), "MMM d, yyyy") : "Date unknown"}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {job.source_url && (
                <a
                  href={job.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">View Original</span>
                </a>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleFindOfficialPosting}
                disabled={isFindingOfficial}
                className="text-xs"
              >
                {isFindingOfficial ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1" />
                    Find Official Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Job
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{job.title}" at {job.company} from your list.
              Any associated applications will remain but will no longer be linked to this job.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJob}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Side - Job Details */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">

          {/* Official Posting Result */}
          {officialPostingResult && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className={`mb-6 border-2 ${
                  officialPostingResult.confidence === 'high' ? 'border-green-200 bg-green-50/30' :
                  officialPostingResult.confidence === 'medium' ? 'border-yellow-200 bg-yellow-50/30' :
                  'border-slate-200 bg-slate-50/30'
                }`}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI Search Result
                      <Badge variant="outline" className={
                        officialPostingResult.confidence === 'high' ? 'bg-green-100 text-green-700' :
                        officialPostingResult.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }>
                        {officialPostingResult.confidence} confidence
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-700">{officialPostingResult.notes}</p>

                    {officialPostingResult.official_url ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200">
                          <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                          <a
                            href={officialPostingResult.official_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-800 break-all"
                          >
                            {officialPostingResult.official_url}
                          </a>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleUpdateSourceUrl}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Use This Link
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setOfficialPostingResult(null)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOfficialPostingResult(null)}
                      >
                        Close
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Application Materials Card - Show at top if exists */}
          {application && application.note_text && (
            <Card className="border-green-200/50 bg-green-50/30 shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <FileText className="w-5 h-5" />
                    Your Generated Cover Letter
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMaterials(!showMaterials)}
                  >
                    {showMaterials ? "Hide" : "Show"}
                  </Button>
                </div>
              </CardHeader>
              {showMaterials && (
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-green-200 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
                      {application.note_text}
                    </pre>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(application.note_text);
                        toast.success("Cover letter copied to clipboard!");
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to Clipboard
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(createPageUrl(`ATSOptimizer?id=${application.id}`))}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Optimize for ATS
                    </Button>
                    {application.current_status === "draft" && (
                      <Button
                        size="sm"
                        onClick={handleApprove}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Ready to Apply
                      </Button>
                    )}
                    {application.current_status === "ready_to_apply" && (
                      <Button
                        size="sm"
                        onClick={handleMarkAsSubmitted}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        I Applied! Mark as Submitted
                      </Button>
                    )}
                  </div>
                  {application.current_status && (
                    <div className="flex items-center gap-2 pt-2 border-t border-green-200 mt-4">
                      <span className="text-sm text-slate-600">Application Status:</span>
                      <Badge className={
                        application.current_status === "submitted" ? "bg-blue-100 text-blue-700 border-blue-200" :
                        application.current_status === "ready_to_apply" ? "bg-green-100 text-green-700 border-green-200" :
                        application.current_status === "interview_scheduled" ? "bg-amber-100 text-amber-700 border-amber-200" :
                        application.current_status === "offer_received" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                        "bg-slate-100 text-slate-700 border-slate-200"
                      }>
                        {application.current_status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}

          {/* Job Description Card */}
          <Card className="border-slate-200/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Job Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                {job.jd_text ? (
                  <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                    {job.jd_text}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No job description available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {job.must_haves && job.must_haves.length > 0 && (
            <Card className="border-slate-200/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Key Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {job.must_haves.map((requirement, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{requirement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {job.skills_extracted && job.skills_extracted.length > 0 && (
            <Card className="border-slate-200/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Skills & Technologies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills_extracted.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side - Score & Actions */}
        <div className="space-y-4 md:space-y-6">
          {/* AI Score */}
          <Card className="border-slate-200/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Relevance Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.score ? (
                <>
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-2xl border-2 ${getScoreColor(job.score)}`}>
                      <Star className="w-6 h-6" />
                      {job.score}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
                    <p className="font-medium text-slate-900 mb-2">Why this score?</p>
                    {job.rationale}
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-500">
                  <p className="mb-4">This job hasn't been analyzed yet</p>
                </div>
              )}

              <Button
                onClick={handleRankJob}
                disabled={isRanking}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isRanking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Rank Job with AI"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Probability Score */}
          {job.probability_score && (
            <Card className="border-emerald-200/50 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-900">
                  <Target className="w-5 h-5" />
                  Success Probability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-2xl bg-emerald-100 text-emerald-700 border-2 border-emerald-200">
                    <TrendingUp className="w-6 h-6" />
                    {job.probability_score}%
                  </div>
                </div>
                <div className="text-sm text-slate-700 bg-white/60 p-4 rounded-lg">
                  <p className="font-medium text-slate-900 mb-2">Success factors:</p>
                  {job.probability_rationale}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cover Letter Generator */}
          {user && (user.subscription_tier === 'starter' && (user.usage_limits?.cover_letters_count || 0) >= 2) ? (
            <UpgradePrompt
              requiredTier="pro"
              feature="unlimited cover letter generation"
              message="You've used your 2 free cover letters this month. Upgrade to Ascent Pro for 10 per month, or Pinnacle for unlimited access."
            />
          ) : (
            <Card className="border-purple-200/50 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <FileText className="w-5 h-5" />
                  AI Cover Letter Generator
                </CardTitle>
                {user && user.usage_limits && (
                  <p className="text-xs text-slate-500 mt-1">
                    {user.usage_limits.cover_letters_count || 0}/{user.subscription_tier === 'starter' ? 2 : user.subscription_tier === 'pro' ? 10 : '∞'} used this month
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Writing Style
                  </label>
                  <Select value={coverLetterVoice} onValueChange={setCoverLetterVoice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your voice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional & Formal</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
                      <SelectItem value="concise">Concise & Direct</SelectItem>
                      <SelectItem value="friendly">Friendly & Conversational</SelectItem>
                      <SelectItem value="storytelling">Storytelling & Narrative</SelectItem>
                      <SelectItem value="data_driven">Data-Driven & Results-Focused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleDraftMaterials}
                  disabled={isDrafting}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isDrafting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Drafting Cover Letter...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Cover Letter
                    </>
                  )}
                </Button>

                {application && (
                  <div className="pt-2 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(createPageUrl(`ATSOptimizer?id=${application.id}`))}
                      className="w-full text-xs"
                    >
                      <TrendingUp className="w-3 h-3 mr-2" />
                      Optimize Cover Letter for ATS
                    </Button>
                    <p className="text-xs text-slate-500 text-center">
                      Enhance your cover letter with keywords to pass automated screening
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resume Optimizer Card */}
          {user?.subscription_tier === 'starter' ? (
            <UpgradePrompt
              requiredTier="pro"
              feature="Resume ATS Optimizer"
              message="Optimize your resume for specific jobs to pass Applicant Tracking Systems. Available with Ascent Pro."
              compact
            />
          ) : (
            <Card className="border-indigo-200/50 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <FileText className="w-5 h-5" />
                  Resume ATS Optimizer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">
                  Optimize your resume for this specific job to pass Applicant Tracking Systems.
                </p>
                <Button
                  onClick={() => navigate(createPageUrl(`ResumeOptimizer?id=${job.id}`))}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Optimize My Resume
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Portfolio Curator Card */}
          {portfolioProjects.length > 0 && (
            user?.subscription_tier === 'starter' ? (
              <UpgradePrompt
                requiredTier="premium"
                feature="AI Portfolio Curator"
                message="Let AI select and position your best projects for specific roles. Exclusive to Pinnacle."
                compact
              />
            ) : (
              <Card className="border-purple-200/50 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Briefcase className="w-5 h-5" />
                    AI Portfolio Curator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Let AI select and position your best projects for this specific role.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Target className="w-4 h-4" />
                    {portfolioProjects.length} projects in your portfolio
                  </div>
                  <Button
                    onClick={handleCuratePortfolio}
                    disabled={isCuratingPortfolio}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isCuratingPortfolio ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Projects...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Curate Portfolio
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          )}

          {/* Advanced AI Tools */}
          <Card className="border-indigo-200/50 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Brain className="w-5 h-5" />
                Advanced AI Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => navigate(createPageUrl(`SkillGapAnalysis?id=${job.id}`))}
                variant="outline"
                className="w-full justify-start"
                disabled={user?.subscription_tier === 'starter'}
              >
                <Target className="w-4 h-4 mr-2" />
                Skill Gap Analysis
                {user?.subscription_tier === 'starter' && (
                  <Badge className="ml-auto bg-indigo-100 text-indigo-700">Pro</Badge>
                )}
              </Button>
              <Button
                onClick={() => navigate(createPageUrl(`InterviewPrep?id=${job.id}`))}
                variant="outline"
                className="w-full justify-start"
                disabled={user?.subscription_tier === 'starter'}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Interview Practice
                {user?.subscription_tier === 'starter' && (
                  <Badge className="ml-auto bg-indigo-100 text-indigo-700">Pro</Badge>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Application Question Answerer */}
          <Card className="border-indigo-200/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Application Question Helper
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="application-question" className="text-sm font-medium text-slate-700">
                  Application Question
                </label>
                <Textarea
                  id="application-question"
                  placeholder="Paste the application question here (e.g., 'Why are you interested in this role?' or 'Describe a time you overcame a challenge.')"
                  value={applicationQuestion}
                  onChange={(e) => setApplicationQuestion(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="voice-tone-select" className="text-sm font-medium text-slate-700">
                  Response Voice/Tone
                </label>
                <Select value={voiceTone} onValueChange={setVoiceTone}>
                  <SelectTrigger id="voice-tone-select">
                    <SelectValue placeholder="Choose your voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional & Formal</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
                    <SelectItem value="concise">Concise & Direct</SelectItem>
                    <SelectItem value="friendly">Friendly & Conversational</SelectItem>
                    <SelectItem value="storytelling">Storytelling (STAR Method)</SelectItem>
                    <SelectItem value="data_driven">Data-Driven & Results-Focused</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateAnswer}
                disabled={isGeneratingAnswer || !applicationQuestion.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isGeneratingAnswer ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Answer...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Answer
                  </>
                )}
              </Button>

              {generatedAnswer && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-700">
                      Generated Answer
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAnswer}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 max-h-64 overflow-y-auto">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {generatedAnswer}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAnswer}
                      className="flex-1"
                      disabled={isGeneratingAnswer}
                    >
                      {isGeneratingAnswer ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Regenerate"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setApplicationQuestion("");
                        setGeneratedAnswer("");
                      }}
                      className="flex-1"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {job.salary_raw && (
            <Card className="border-slate-200/50 shadow-sm">
              <CardHeader>
                <CardTitle>Compensation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 font-medium">{job.salary_raw}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Portfolio Curation Results Dialog */}
      <Dialog open={showCuratePortfolioDialog} onOpenChange={setShowCuratePortfolioDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              AI-Curated Portfolio for This Role
            </DialogTitle>
          </DialogHeader>
          {portfolioCuration && (
            <div className="space-y-6 mt-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">
                  For: {portfolioCuration.job_title} at {portfolioCuration.job_company}
                </h3>
                <p className="text-sm text-purple-700">
                  {portfolioCuration.curation.overall_strategy}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Recommended Projects (in order of presentation):
                </h3>
                <div className="space-y-4">
                  {portfolioCuration.curation.curated_projects
                    .sort((a, b) => a.suggested_order - b.suggested_order)
                    .map((curatedProject) => {
                      const project = portfolioProjects.find(p => p.id === curatedProject.project_id);
                      if (!project) return null;

                      return (
                        <Card key={project.id} className="border-2 border-purple-200">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className="bg-purple-100 text-purple-700">
                                    #{curatedProject.suggested_order}
                                  </Badge>
                                  <h4 className="font-bold text-slate-900">{project.title}</h4>
                                </div>
                                <p className="text-sm text-slate-600">{project.project_type?.replace('_', ' ')}</p>
                              </div>
                              <Badge className="bg-purple-600 text-white">
                                <Star className="w-3 h-3 mr-1" />
                                {curatedProject.relevance_score}% Match
                              </Badge>
                            </div>

                            {project.thumbnail_url && (
                              <div className="mb-3 rounded-lg overflow-hidden">
                                <img
                                  src={project.thumbnail_url}
                                  alt={project.title}
                                  className="w-full h-32 object-cover"
                                />
                              </div>
                            )}

                            <div className="space-y-3">
                              <div className="bg-purple-50 p-3 rounded">
                                <p className="text-xs font-medium text-purple-900 mb-1">Why This Project:</p>
                                <p className="text-sm text-purple-700">{curatedProject.why_relevant}</p>
                              </div>

                              <div>
                                <p className="text-xs font-medium text-slate-700 mb-1">Key Highlights to Emphasize:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {curatedProject.key_highlights.map((highlight, i) => (
                                    <li key={i} className="text-sm text-slate-600">{highlight}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="bg-green-50 p-3 rounded border border-green-200">
                                <p className="text-xs font-medium text-green-900 mb-1 flex items-center gap-1">
                                  <MessageCircle className="w-3 h-3" />
                                  How to Position This Project:
                                </p>
                                <p className="text-sm text-green-700">{curatedProject.positioning_advice}</p>
                              </div>

                              {project.url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(project.url, '_blank')}
                                  className="w-full"
                                >
                                  <ExternalLink className="w-3 h-3 mr-2" />
                                  View Project
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>

              {portfolioCuration.curation.presentation_tips && portfolioCuration.curation.presentation_tips.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Presentation Tips:
                  </h3>
                  <ul className="space-y-1">
                    {portfolioCuration.curation.presentation_tips.map((tip, i) => (
                      <li key={i} className="text-sm text-blue-700">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {portfolioCuration.curation.missing_elements && portfolioCuration.curation.missing_elements.length > 0 && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h3 className="font-semibold text-amber-900 mb-2">Portfolio Gaps:</h3>
                  <p className="text-sm text-amber-700 mb-2">Consider adding projects that demonstrate:</p>
                  <ul className="space-y-1">
                    {portfolioCuration.curation.missing_elements.map((element, i) => (
                      <li key={i} className="text-sm text-amber-700">• {element}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = createPageUrl("Portfolio")}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Manage Portfolio
                </Button>
                <Button onClick={() => setShowCuratePortfolioDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
