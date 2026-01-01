// استيراد المكونات والمكتبات المطلوبة
// Import required components and libraries
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import AnimatedBackground from "@/components/common/AnimatedBackground";
import { ParticlesBackground } from "@/components/common/ParticlesBackground";
import {
  Brain,
  Sparkles,
  FileText,
  GraduationCap,
  ArrowLeft,
  Zap,
  BookOpen,
  Target,
  HelpCircle,
  CheckCircle2,
  BarChart3,
  Heart,
  Rocket,
  Cpu,
  Layers,
} from "lucide-react";

// قائمة المميزات
// Features list
const features = [
  {
    icon: Brain,
    titleAr: "ذكاء اصطناعي متقدم",
    titleEn: "Advanced AI",
    descriptionAr: "إجابات دقيقة من محتوى المقرر مع استشهادات",
    color: "from-purple-500 to-purple-600",
    bgLight: "bg-purple-100 dark:bg-purple-500/20",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: Sparkles,
    titleAr: "أدوات دراسة تفاعلية",
    titleEn: "Interactive Study Tools",
    descriptionAr: "بطاقات مراجعة واختبارات وتلخيصات ذكية",
    color: "from-pink-500 to-pink-600",
    bgLight: "bg-pink-100 dark:bg-pink-500/20",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
  {
    icon: Target,
    titleAr: "دقة عالية في الاسترجاع",
    titleEn: "High Retrieval Accuracy",
    descriptionAr: "بحث هجين مع دعم كامل للغة العربية",
    color: "from-orange-500 to-orange-600",
    bgLight: "bg-orange-100 dark:bg-orange-500/20",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
];

// قائمة الإحصائيات
// Stats list
const stats = [
  { value: "RAG", labelAr: "نظام الاسترجاع المعزز", labelEn: "Retrieval Augmented Generation" },
  { value: "AI", labelAr: "ذكاء اصطناعي", labelEn: "Artificial Intelligence" },
  { value: "NLP", labelAr: "معالجة اللغة الطبيعية", labelEn: "Natural Language Processing" },
];

// مكون الصفحة الرئيسية
// Home page component
export default function Home() {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Enhanced Animated Background */}
      <AnimatedBackground />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl" dir="rtl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60 dark:from-purple-500 dark:to-pink-500 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 dark:from-purple-500 dark:to-pink-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  RAG Assistant
                </h1>
                <p className="text-xs text-muted-foreground">مساعد الدراسة الذكي</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/study">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">أدوات الدراسة</span>
                </Button>
              </Link>
              <Link to="/status">
                <Button variant="ghost" size="sm" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">حالة المحتوى</span>
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32" dir="rtl">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Particles Background */}
            <div className="absolute inset-0 -z-10">
              <ParticlesBackground particleCount={80} />
            </div>

            {/* Badge */}
            <Badge
              variant="outline"
              className="mb-8 px-4 py-2 text-sm border-primary/50 bg-primary/10 dark:bg-primary/20 text-primary animate-fade-in hover:scale-110 hover:-translate-y-1 transition-all duration-300 glow-animation relative overflow-hidden group backdrop-blur-sm"
            >
              <span className="absolute inset-0 shine-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Rocket className="h-3 w-3 ml-2 animate-pulse relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              <span dir="ltr" className="bidi-isolate relative z-10">RAG System</span> <span className="relative z-10">•</span> <span className="relative z-10">مساعد الدراسة الذكي</span>
            </Badge>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight" dir="rtl">
              <span className="bg-gradient-to-l from-primary via-primary/80 to-purple-600 dark:from-purple-400 dark:via-pink-500 dark:to-orange-400 bg-clip-text text-transparent inline-block hover:scale-105 transition-transform duration-300 animate-fade-in-up" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                مساعد الدراسة
              </span>
              <br />
              <span className="bg-gradient-to-l from-purple-600 via-primary to-pink-600 dark:from-cyan-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent inline-block hover:scale-105 transition-transform duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                بالذكاء الاصطناعي
              </span>
            </h1>

            {/* Subtitle */}
            <div className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.4s' }} dir="rtl">
              <p>
                نظام <span className="text-primary font-medium relative inline-block group" dir="ltr" style={{ unicodeBidi: 'embed', display: 'inline-block' }}>
                  <span className="absolute inset-0 bg-primary/20 blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />
                  <span className="relative">RAG</span>
                </span> متقدم يجيب على أسئلتك
                من مواد المقرر مع <span className="text-pink-600 dark:text-pink-400 font-medium hover:scale-110 inline-block transition-transform duration-200">استشهادات دقيقة</span>
              </p>
            </div>

            {/* English tagline */}
            <p className="text-sm text-muted-foreground mb-8 animate-fade-in bidi-isolate" dir="ltr">
              Powered by <span className="text-primary">Retrieval Augmented Generation</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <Link to="/app">
                <Button
                  size="lg"
                  className="h-14 px-8 text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 group hover:scale-110 hover:-translate-y-1 relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 dark:from-purple-500 dark:to-pink-500"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative flex items-center gap-2 z-10">
                    ابدأ الآن
                    <ArrowLeft className="h-5 w-5 group-hover:-translate-x-2 transition-transform duration-300" />
                  </span>
                </Button>
              </Link>
              <Link to="/study">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-base rounded-xl transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:bg-primary/5 hover:border-primary/50 group backdrop-blur-sm bg-background/80"
                >
                  <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                  أدوات الدراسة الجاهزة
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative z-10" dir="rtl">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground animate-fade-in-up">
              خدمات المشروع
            </h2>
            <p className="text-muted-foreground text-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}>أدوات متقدمة لتعزيز تجربة التعلم</p>
            <p className="text-muted-foreground/70 text-sm mt-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }} dir="ltr">
              Advanced tools to enhance your learning experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, idx) => {
              const colorGradients = [
                'from-purple-500 to-purple-600',
                'from-pink-500 to-pink-600',
                'from-orange-500 to-orange-600',
              ];
              const glowColors = [
                'rgba(168, 85, 247, 0.3)',
                'rgba(236, 72, 153, 0.3)',
                'rgba(249, 115, 22, 0.3)',
              ];
              const borderGlowColors = [
                'from-purple-500/30 to-purple-600/30',
                'from-pink-500/30 to-pink-600/30',
                'from-orange-500/30 to-orange-600/30',
              ];
              const iconGlowShadows = [
                '0 0 20px rgba(168, 85, 247, 0.3), 0 0 40px rgba(168, 85, 247, 0.5), 0 0 20px rgba(168, 85, 247, 0.3)',
                '0 0 20px rgba(236, 72, 153, 0.3), 0 0 40px rgba(236, 72, 153, 0.5), 0 0 20px rgba(236, 72, 153, 0.3)',
                '0 0 20px rgba(249, 115, 22, 0.3), 0 0 40px rgba(249, 115, 22, 0.5), 0 0 20px rgba(249, 115, 22, 0.3)',
              ];
              
              return (
              <div
                key={idx}
                className="group relative animate-fade-in-up"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <Card
                  className="h-full cursor-pointer relative overflow-hidden border border-gray-200/50 dark:border-white/30 bg-white/90 dark:bg-slate-800/85 backdrop-blur-md shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-cyan-500/10 hover:border-indigo-500/30 dark:hover:border-cyan-500/30 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]"
                >
                  {/* Animated Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${colorGradients[idx]} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-15 transition-opacity duration-500`} />

                  {/* Glowing Border Effect */}
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className={`absolute inset-0 rounded-lg bg-gradient-to-r ${borderGlowColors[idx]} blur-2xl opacity-30`} />
                  </div>
                  
                  {/* Radial gradient overlay on hover */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  <CardContent className="p-8 relative z-10">
                    {/* Icon with enhanced hover animation */}
                    <div
                      className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${colorGradients[idx]} flex items-center justify-center mb-6 shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 icon-pulse-glow`}
                      style={{
                        animation: `iconPulseGlow 2s ease-in-out infinite ${idx * 0.3}s`,
                        '--glow-shadow': iconGlowShadows[idx],
                      } as React.CSSProperties}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer rounded-2xl" />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 animate-shimmer rounded-2xl" style={{ animationDuration: '2s' }} />
                      
                      <feature.icon className="h-8 w-8 text-white relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-primary transition-colors duration-300">
                      {feature.titleAr}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300" dir="ltr">
                      {feature.titleEn}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-white leading-relaxed min-h-[40px] group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
                      {feature.descriptionAr}
                    </p>
                    
                    {/* Button with arrow - enhanced animation */}
                    <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                      <span>ابدأ الآن</span>
                      <ArrowLeft className="h-4 w-4 transform group-hover:translate-x-[-4px] transition-transform duration-300" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              );
            })}
          </div>
        </div>
      </section>

          {/* Quote Section */}
      <section className="py-16 relative z-10" dir="ltr">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto overflow-hidden border-0 bg-gradient-to-r from-primary via-primary/80 to-pink-600 dark:from-purple-500 dark:via-pink-500 dark:to-orange-400 shadow-2xl shadow-primary/30 hover:shadow-3xl hover:shadow-primary/40 transition-all duration-500 hover:scale-[1.02] animate-scale-in group glow-quote relative backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <CardContent className="p-10 sm:p-14 relative">
              <div className="absolute top-6 left-8 text-6xl text-white/20 font-serif animate-float opacity-70 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">❝</div>
              <div className="absolute bottom-6 right-8 text-6xl text-white/20 font-serif animate-float opacity-70 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500" style={{ animationDelay: '1s' }}>❞</div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-0 shine-effect opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <blockquote className="text-xl sm:text-2xl text-white text-center leading-relaxed font-medium relative z-10 animate-fade-in-up px-4 group-hover:scale-105 transition-transform duration-300">
                "RAG (Retrieval Augmented Generation) revolutionizes how AI answers questions by combining the power of language models with precise document retrieval, ensuring accurate and cited responses."
              </blockquote>
              <p className="text-center mt-6 text-white/80 flex items-center justify-center gap-2 animate-fade-in-up relative z-10 group-hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.3s' }}>
                <Cpu className="h-4 w-4 animate-pulse-slow group-hover:rotate-180 transition-transform duration-500" />
                Project Philosophy
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative z-10" dir="rtl">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
            {stats.map((stat, idx) => {
              const statColors = [
                { gradient: 'from-blue-500 to-cyan-500', glow: 'rgba(59, 130, 246, 0.3)', borderGlow: 'from-blue-500/30 to-cyan-500/30' },
                { gradient: 'from-indigo-500 to-purple-500', glow: 'rgba(99, 102, 241, 0.3)', borderGlow: 'from-indigo-500/30 to-purple-500/30' },
                { gradient: 'from-purple-500 to-pink-500', glow: 'rgba(168, 85, 247, 0.3)', borderGlow: 'from-purple-500/30 to-pink-500/30' },
              ];
              const color = statColors[idx];
              
              return (
              <div 
                key={idx} 
                className="group text-center p-6 rounded-2xl bg-white/90 dark:bg-slate-800/85 border border-gray-200/50 dark:border-white/30 backdrop-blur-md hover:border-gray-300 dark:hover:border-white/50 transition-all duration-500 hover:scale-105 hover:-translate-y-2 relative overflow-hidden animate-fade-in-up shadow-xl hover:shadow-2xl"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Animated background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-15 transition-opacity duration-500`} />
                
                {/* Glowing border effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${color.borderGlow} blur-2xl opacity-30`} />
                </div>
                
                {/* Radial gradient overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Shine effect */}
                <div className="absolute inset-0 shine-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div 
                    className={`text-3xl sm:text-4xl font-bold mb-2 group-hover:scale-110 transition-all duration-300 group-hover:rotate-3 inline-block bg-gradient-to-r ${color.gradient} bg-clip-text text-transparent`}
                    style={{
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {stat.value}
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white font-semibold group-hover:text-primary transition-colors duration-300 group-hover:scale-105 inline-block transition-transform duration-300">{stat.labelAr}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300" dir="ltr">{stat.labelEn}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tools Preview */}
      <section className="py-20 relative z-10" dir="rtl">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground animate-fade-in-up">أدوات الدراسة المتاحة</h2>
            <p className="text-muted-foreground text-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }} dir="ltr">Available Study Tools</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: HelpCircle, labelAr: "أسئلة واختبارات", labelEn: "Quizzes", colorClass: "text-green-600 dark:text-green-400", hoverBg: "hover:bg-green-500/10", gradient: "from-green-500 to-emerald-500" },
              { icon: FileText, labelAr: "تلخيصات ذكية", labelEn: "Summaries", colorClass: "text-yellow-600 dark:text-yellow-400", hoverBg: "hover:bg-yellow-500/10", gradient: "from-yellow-500 to-orange-500" },
              { icon: BookOpen, labelAr: "بطاقات مراجعة", labelEn: "Flashcards", colorClass: "text-blue-600 dark:text-blue-400", hoverBg: "hover:bg-blue-500/10", gradient: "from-blue-500 to-cyan-500" },
              { icon: CheckCircle2, labelAr: "استشهادات دقيقة", labelEn: "Citations", colorClass: "text-purple-600 dark:text-purple-400", hoverBg: "hover:bg-purple-500/10", gradient: "from-purple-500 to-pink-500" },
            ].map((tool, idx) => {
              const toolGlowShadows = [
                '0 0 15px rgba(34, 197, 94, 0.3), 0 0 30px rgba(34, 197, 94, 0.2)',
                '0 0 15px rgba(234, 179, 8, 0.3), 0 0 30px rgba(234, 179, 8, 0.2)',
                '0 0 15px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.2)',
                '0 0 15px rgba(168, 85, 247, 0.3), 0 0 30px rgba(168, 85, 247, 0.2)',
              ];
              
              return (
              <Link key={idx} to="/study">
                <div
                  className="group relative flex items-center gap-3 p-4 rounded-xl bg-white/90 dark:bg-slate-800/85 border border-gray-200/50 dark:border-white/30 backdrop-blur-md hover:border-indigo-500/30 dark:hover:border-cyan-500/30 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-cyan-500/10 animate-fade-in-up overflow-hidden"
                  style={{ animationDelay: `${idx * 80}ms` }}
                  dir="rtl"
                >
                  {/* Animated background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-15 transition-opacity duration-500`} />
                  
                  {/* Glowing border effect */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tool.gradient} blur-2xl opacity-30`} />
                  </div>
                  
                  {/* Radial gradient overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  
                  {/* Icon with enhanced animation */}
                  <div 
                    className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 icon-pulse-glow`}
                    style={{
                      animation: `iconPulseGlow 2s ease-in-out infinite ${idx * 0.2}s`,
                      '--glow-shadow': toolGlowShadows[idx],
                    } as React.CSSProperties}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer rounded-xl" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 animate-shimmer rounded-xl" style={{ animationDuration: '2s' }} />
                    
                    <tool.icon className={`h-6 w-6 text-white relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`} />
                  </div>
                  
                  <div className="text-right relative z-10 flex-1">
                    <span className="font-semibold block text-gray-900 dark:text-white group-hover:text-primary transition-colors duration-300">{tool.labelAr}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 bidi-isolate" dir="ltr">{tool.labelEn}</span>
                  </div>
                </div>
              </Link>
            )})}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-muted/30 backdrop-blur-md relative z-10" dir="rtl">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-lg mb-2">
            <span className="text-foreground">صُنع بـ</span>
            <Heart className="h-5 w-5 text-pink-500 fill-pink-500 animate-pulse" />
            <span className="text-foreground">بواسطة</span>
            <span className="font-bold text-primary bidi-isolate" dir="ltr">
              Tareq Mhysen
            </span>
          </div>
          <p className="text-sm text-muted-foreground bidi-isolate" dir="ltr">
            RAG Course Assistant • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
