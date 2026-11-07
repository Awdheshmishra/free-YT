import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, Bell, Check, ChevronDown,
  CircleHelp, Clock3, Compass, Download, Ellipsis, ExternalLink, Film,
  History, Home, Infinity as InfinityIcon, ListVideo, Menu, Mic, MoreHorizontal, Play, Plus, Search,
  Settings2, Share2, ShieldCheck, Sparkles, ThumbsUp, Tv, X
} from 'lucide-react';
import { videos, categories, imageUrl } from './data';
import { hasYouTubeApiKey, searchYouTubeVideos } from './youtube';

const navPrimary = [
  { label: 'Home', icon: Home }, { label: 'Explore', icon: Compass },
  { label: 'Subscriptions', icon: Tv }
];

const readLocalList = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

let youtubeApiPromise;

function loadYouTubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('youtube-iframe-api');
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      resolve(window.YT);
      if (typeof previousCallback === 'function') previousCallback();
    };

    if (existingScript) {
      existingScript.addEventListener('error', () => {
        youtubeApiPromise = undefined;
        reject(new Error('YouTube player API could not be loaded.'));
      }, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'youtube-iframe-api';
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => {
      youtubeApiPromise = undefined;
      reject(new Error('YouTube player API could not be loaded.'));
    };
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

const mergeVideos = (current, incoming) => {
  const byId = new Map([...current, ...incoming].map((video) => [video.id, video]));
  return [...byId.values()].slice(-100);
};

function App() {
  const [section, setSection] = useState('Home');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);
  const [history, setHistory] = useState(() => readLocalList('luma:history'));
  const [saved, setSaved] = useState(() => readLocalList('luma:watch-later'));
  const [dynamicVideos, setDynamicVideos] = useState(() => readLocalList('luma:search-cache'));
  const [toast, setToast] = useState('');
  const [dialog, setDialog] = useState('');
  const [apiResults, setApiResults] = useState([]);
  const [apiStatus, setApiStatus] = useState('idle');
  const [apiError, setApiError] = useState('');
  const [resolvedQuery, setResolvedQuery] = useState('');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const searchInputRef = useRef(null);
  const searchShortcut = navigator.platform.includes('Mac') ? '⌘ K' : 'Ctrl K';

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)');
    const updateInstalled = () => setIsInstalled(standalone.matches || window.navigator.standalone === true);
    const handleInstallAvailable = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    updateInstalled();
    standalone.addEventListener('change', updateInstalled);
    window.addEventListener('beforeinstallprompt', handleInstallAvailable);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      standalone.removeEventListener('change', updateInstalled);
      window.removeEventListener('beforeinstallprompt', handleInstallAvailable);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    try { localStorage.setItem('luma:history', JSON.stringify(history)); } catch { /* local storage may be unavailable */ }
  }, [history]);
  useEffect(() => {
    try { localStorage.setItem('luma:watch-later', JSON.stringify(saved)); } catch { /* local storage may be unavailable */ }
  }, [saved]);
  useEffect(() => {
    try { localStorage.setItem('luma:search-cache', JSON.stringify(dynamicVideos)); } catch { /* local storage may be unavailable */ }
  }, [dynamicVideos]);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setApiResults([]);
      setApiError('');
      setApiStatus('idle');
      setResolvedQuery('');
      return;
    }

    setResolvedQuery(term);
    setApiError('');
    if (!hasYouTubeApiKey) {
      setApiResults([]);
      setApiStatus('unconfigured');
      return;
    }

    const controller = new AbortController();
    setApiStatus('loading');
    const timer = window.setTimeout(async () => {
      try {
        const results = await searchYouTubeVideos(term, controller.signal);
        setApiResults(results);
        setDynamicVideos((current) => mergeVideos(current, results));
        setApiStatus('ready');
      } catch (error) {
        if (error.name === 'AbortError') return;
        setApiError(error.message);
        setApiStatus('error');
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const filtered = useMemo(() => {
    if ((section === 'Home' || section === 'Explore') && query.trim() && hasYouTubeApiKey && resolvedQuery === query.trim()) {
      if (apiStatus !== 'ready') return [];
      return apiResults;
    }

    const catalog = [...videos, ...dynamicVideos, ...apiResults];
    let list = [...videos];
    if (section === 'History') list = history.map((id) => catalog.find((v) => v.id === id)).filter(Boolean);
    if (section === 'Watch later') list = saved.map((id) => catalog.find((v) => v.id === id)).filter(Boolean);
    if (section === 'Subscriptions') list = videos.filter((v) => ['Maya in Motion', 'Soft Hours', 'Open House', 'The Sunday Edit'].includes(v.channel));
    if (section === 'Explore') list = [...videos].reverse();
    if (category !== 'All' && section === 'Home') list = list.filter((v) => v.category === category);
    if (query.trim()) {
      const term = query.toLowerCase();
      list = list.filter((v) => `${v.title} ${v.channel} ${v.category}`.toLowerCase().includes(term));
    }
    return list;
  }, [section, category, query, history, saved, dynamicVideos, apiResults, apiStatus, resolvedQuery]);

  const notify = (message) => { setToast(message); window.clearTimeout(notify.timer); notify.timer = window.setTimeout(() => setToast(''), 2600); };
  const playVideo = (video) => {
    if (video.source === 'youtube-api') setDynamicVideos((current) => mergeVideos(current, [video]));
    setActiveVideo(video);
    setHistory((current) => [video.id, ...current.filter((id) => id !== video.id)].slice(0, 12));
  };
  const toggleSaved = (video) => {
    if (video.source === 'youtube-api') setDynamicVideos((current) => mergeVideos(current, [video]));
    setSaved((current) => current.includes(video.id) ? current.filter((id) => id !== video.id) : [video.id, ...current]);
    notify(saved.includes(video.id) ? 'Removed from Watch later' : 'Added to Watch later');
  };
  const installApp = async () => {
    if (!installPrompt) {
      const instructions = /iphone|ipad|ipod/i.test(navigator.userAgent)
        ? 'In Safari, tap Share → Add to Home Screen.'
        : 'In your browser menu, choose Install app or Add to Home screen.';
      notify(instructions);
      return;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
      setInstallPrompt(null);
    } catch (error) {
      console.error('PWA installation prompt failed:', error);
      notify('Could not open the install prompt. Try Install app from the browser menu.');
    }
  };

  return <div className="app-shell min-h-screen bg-neutral-950 text-stone-100 antialiased">
    <header className="topbar">
      <div className="brand-cluster">
        <button className="icon-button menu-button" aria-label="Toggle sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={21} /></button>
        <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); setSection('Home'); }}><span className="brand-mark"><InfinityIcon size={18} strokeWidth={2.5} /></span><span>infinity</span><span className="brand-premium">PREMIUM</span></a>
      </div>
      <div className={`search-wrap ${searchOpen ? 'search-focused' : ''}`}>
        <div className="search-box"><Search size={19} /><input ref={searchInputRef} aria-label="Search" placeholder="Search videos, creators, and more" value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setSearchOpen(true)} onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)} />{query && <button className="clear-search" onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}<span className="search-shortcut">{searchShortcut}</span></div>
        <button className="voice-search icon-button" title="Voice search" onClick={() => notify('Voice search is not enabled in this demo')}><Mic size={18} /></button>
      </div>
      <div className="top-actions">{!isInstalled && <button className="install-button" onClick={installApp}><Download size={15}/><span>Install</span></button>}<button className="create-button" onClick={() => setDialog('account')}><Plus size={17} /><span>Connect</span></button><button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify('You’re all caught up')}><Bell size={19} /><i /></button><button className="profile-button" onClick={() => setDialog('account')} aria-label="Account">A</button></div>
    </header>
    <div className="app-body">
      {sidebarOpen && <aside className="sidebar">
        <div className="nav-group">{navPrimary.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${section === label ? 'selected' : ''}`} onClick={() => { setSection(label); setCategory('All'); }}><Icon size={20} strokeWidth={section === label ? 2.3 : 1.8} /><span>{label}</span></button>)}</div>
        <div className="nav-divider" />
        <button className="nav-heading" onClick={() => setSection('Library')}>Your space <ChevronDown size={15} /></button>
        <div className="nav-group compact-nav">
          <button className={`nav-item ${section === 'History' ? 'selected' : ''}`} onClick={() => setSection('History')}><History size={19} /><span>History</span></button>
          <button className={`nav-item ${section === 'Watch later' ? 'selected' : ''}`} onClick={() => setSection('Watch later')}><Clock3 size={19} /><span>Watch later</span>{saved.length > 0 && <small>{saved.length}</small>}</button>
          <button className="nav-item" onClick={() => setDialog('downloads')}><ArrowDownToLine size={19} /><span>Downloads</span></button>
          <button className="nav-item" onClick={() => notify('Create a playlist from a video’s save menu')}><ListVideo size={19} /><span>My playlists</span></button>
        </div>
        <div className="nav-divider" />
        <div className="sidebar-label">YOUR CHANNELS</div>
        {['Maya in Motion', 'Soft Hours', 'Northwood Workshop'].map((name, i) => <button key={name} className="channel-nav" onClick={() => { setSection('Subscriptions'); setCategory('All'); }}><span className={`channel-avatar mini avatar-${i}`}>{name[0]}</span><span>{name}</span><i className={i === 0 ? 'live-dot' : 'unread-dot'} /></button>)}
        <div className="sidebar-bottom"><div className="premium-card"><div className="premium-card-icon"><Sparkles size={15} /></div><div><strong>Your quieter corner</strong><p>Make room for what you love.</p></div></div><div className="sidebar-footer"><button onClick={() => setDialog('about')}><CircleHelp size={16} /> Help</button><button onClick={() => setDialog('about')}><Settings2 size={16} /> About</button></div><div className="legal-line">About · Press · Copyright<br />Terms · Privacy · Policy & Safety</div></div>
      </aside>}

      <main className="main-content">
        {section === 'Home' && !query && <section className="welcome-banner"><div className="welcome-copy"><div className="eyebrow"><span className="eyebrow-dot" /> YOUR SPACE, AT YOUR PACE</div><h1>A little more <em>you.</em></h1><p>Good things to watch, picked for the way you like to spend your time.</p><button className="banner-cta" onClick={() => setSection('Explore')}>Find your next favorite <ArrowRight size={16} /></button></div><div className="banner-art"><div className="art-orb orb-one"/><div className="art-orb orb-two"/><div className="art-window"><span className="window-line w1"/><span className="window-line w2"/><span className="window-line w3"/><span className="window-play"><Play fill="currentColor" size={18}/></span></div><div className="art-sparkle"><Sparkles size={21}/></div><div className="art-caption">take the scenic route</div></div><div className="banner-grain" /></section>}
        {(section === 'Home' || section === 'Explore') && <div className="category-row"><div className="category-scroll">{categories.map((item) => <button key={item} className={`category-pill ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div><button className="category-next" aria-label="Scroll categories" onClick={(e) => e.currentTarget.previousSibling.scrollBy({ left: 260, behavior: 'smooth' })}><ArrowRight size={17}/></button></div>}
        <div className="section-title-row"><div><div className="section-kicker">{section === 'Home' ? 'MADE FOR YOUR MOMENTS' : section === 'Subscriptions' ? 'FROM YOUR CREATORS' : section === 'History' ? 'PICK UP WHERE YOU LEFT OFF' : section === 'Watch later' ? 'SAVED FOR A SLOWER DAY' : 'A LITTLE INSPIRATION'}</div><h2>{query ? `Results for “${query}”` : section === 'Home' ? 'Your next watch' : section === 'Explore' ? 'Explore something new' : section}</h2></div>{(section === 'Home' || section === 'Explore') && <button className="view-all" onClick={() => setSection('Explore')}>Explore all <ArrowRight size={15}/></button>}</div>
        {query.trim() && apiStatus === 'unconfigured' && <div className="api-notice"><div><strong>Live YouTube search isn’t connected yet.</strong><span>Search currently checks only the sample videos in this demo.</span></div><button onClick={() => setDialog('api')}>Set up API <ArrowRight size={14}/></button></div>}
        {filtered.length ? <div className="video-grid">{filtered.map((video, i) => <VideoCard key={`${video.id}-${i}`} video={video} onPlay={playVideo} onSave={toggleSaved} saved={saved.includes(video.id)} onMore={() => notify('More options coming soon')} />)}</div> : <div className="empty-state"><div className="empty-icon"><Film size={24}/></div><h3>{apiStatus === 'loading' ? 'Searching YouTube…' : apiStatus === 'error' ? 'YouTube search failed' : query ? 'No matches just yet' : section === 'Watch later' ? 'Save a video for later' : section === 'History' ? 'Your watch history is clear' : 'Nothing here yet'}</h3><p>{apiStatus === 'loading' ? 'Looking for matching videos.' : apiStatus === 'error' ? apiError : apiStatus === 'unconfigured' ? 'Add a YouTube API key to search beyond the sample videos.' : query ? 'Try another title, creator, or topic.' : 'When you find something you love, it’ll show up here.'}</p>{apiStatus === 'unconfigured' && <button onClick={() => setDialog('api')}>Set up YouTube search <ArrowRight size={15}/></button>}{!query && <button onClick={() => setSection('Explore')}>Explore videos <ArrowRight size={15}/></button>}</div>}
        <footer className="content-footer"><span>Made for curious minds</span><span className="footer-sparkle">✳</span><span>Take your time.</span></footer>
      </main>
    </div>
    {activeVideo && <PlayerModal video={activeVideo} onPlay={playVideo} onClose={() => setActiveVideo(null)} onSave={() => toggleSaved(activeVideo)} saved={saved.includes(activeVideo.id)} onDownload={() => setDialog('downloads')} notify={notify} />}
    {dialog && <InfoDialog type={dialog} onClose={() => setDialog('')} />}
    {toast && <div className="toast"><Check size={16}/>{toast}</div>}
  </div>;
}

function VideoCard({ video, onPlay, onSave, saved, onMore }) {
  return <article className="video-card">
    <button className="thumbnail" onClick={() => onPlay(video)} aria-label={`Play ${video.title}`}><img src={video.thumbnail || imageUrl(video.image)} alt="" loading="lazy" /><span className="thumbnail-overlay"><span className="large-play"><Play size={20} fill="currentColor" /></span></span>{video.duration && <span className="duration">{video.duration}</span>}<span className="watch-progress" style={{ width: video.id === 'L_jWHffIx5E' ? '36%' : '0%' }} /></button>
    <div className="video-meta"><div className={`channel-avatar avatar-${video.tone}`}>{video.avatar}</div><div className="video-info"><button className="video-title" onClick={() => onPlay(video)}>{video.title}</button><div className="channel-line">{video.channel}{video.verified && <span className="verified" title="Verified"><Check size={9} /></span>}</div><div className="video-stats">{video.views}<span>·</span>{video.age}</div></div><button className="more-button" aria-label="More options" onClick={() => onMore()}><MoreHorizontal size={18}/></button></div>
    <div className="card-hover-actions"><button onClick={() => onSave(video)}>{saved ? <Check size={14}/> : <Clock3 size={14}/>} {saved ? 'Saved' : 'Watch later'}</button><button onClick={() => onPlay(video)}><Play size={14} fill="currentColor"/> Play</button></div>
  </article>;
}

function YouTubePlayer({ videoId, title }) {
  const hostRef = useRef(null);
  const [playbackError, setPlaybackError] = useState('');
  const isEmbeddedBrowser = /Electron|Code\//i.test(navigator.userAgent);

  useEffect(() => {
    let cancelled = false;
    let player;

    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;
      const iframe = document.createElement('iframe');
      const params = new URLSearchParams({
        autoplay: '1',
        enablejsapi: '1',
        origin: window.location.origin,
        playsinline: '1',
        rel: '0'
      });
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params}`;
      iframe.title = title;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;
      hostRef.current.appendChild(iframe);

      player = new YT.Player(iframe, {
        events: {
          onError: (event) => {
            if (cancelled) return;
            const reason = event.data === 5
              ? 'This browser cannot decode the video format selected by YouTube.'
              : event.data === 101 || event.data === 150
                ? 'The video owner does not allow playback on other websites.'
                : `YouTube player error (${event.data}).`;
            setPlaybackError(reason);
          }
        }
      });
    }).catch((error) => {
      if (cancelled) return;
      console.error(error);
      setPlaybackError('The YouTube player could not be loaded in this browser.');
    });

    return () => {
      cancelled = true;
      player?.destroy();
      hostRef.current?.replaceChildren();
    };
  }, [videoId, title]);

  return <>
    <div className="youtube-player-host" ref={hostRef} />
    {isEmbeddedBrowser && <div className="player-browser-warning">
      VS Code’s built-in browser may not include the video codecs YouTube needs. Open this app in Chrome or Edge. On Windows N editions, install the Media Feature Pack.
    </div>}
    {playbackError && <div className="player-fallback">
      <strong>Can’t play this video here</strong>
      <span>{playbackError}</span>
      <a href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`} target="_blank" rel="noreferrer">Open on YouTube <ExternalLink size={15}/></a>
    </div>}
  </>;
}

function PlayerModal({ video, onPlay, onClose, onSave, saved, onDownload, notify }) {
  const [liked, setLiked] = useState(false);
  const copyVideoLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${video.id}`);
      notify('Video link copied');
    } catch {
      notify('Could not copy the link. Check your browser clipboard permissions.');
    }
  };

  return <div className="modal-backdrop player-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="player-modal"><div className="player-top"><button className="back-player" onClick={onClose}><ArrowLeft size={17}/> <span>Back to browsing</span></button><div className="player-brand"><span className="brand-mark"><InfinityIcon size={16} strokeWidth={2.5} /></span> infinity <span className="brand-premium">PREMIUM</span></div><div className="player-top-actions"><button className="open-youtube" onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank', 'noopener,noreferrer')}><ExternalLink size={14}/><span>Open on YouTube</span></button><button className="icon-button close-player" onClick={onClose} aria-label="Close"><X size={20}/></button></div></div>
      <div className="player-layout"><div className="player-primary"><div className="embed-frame"><YouTubePlayer videoId={video.id} title={video.title} /></div><div className="player-title-row"><div><div className="player-overline">NOW PLAYING <span>·</span> {video.category.toUpperCase()}</div><h2>{video.title}</h2></div><button className="player-more" onClick={() => notify('More options coming soon')}><Ellipsis size={21}/></button></div><div className="player-details"><div className="player-channel"><div className={`channel-avatar avatar-${video.tone}`}>{video.avatar}</div><div><strong>{video.channel}</strong><span>{video.views}</span></div><button className="subscribe-button" onClick={() => notify('Open Connect to sync subscriptions')}>Subscribe</button></div><div className="player-actions"><button className={`action-chip ${liked ? 'action-on' : ''}`} onClick={() => setLiked(!liked)}><ThumbsUp size={17}/><span>{liked ? 'Liked' : 'Like'}</span></button><button className="action-chip" onClick={copyVideoLink}><Share2 size={17}/><span>Share</span></button><button className={`action-chip ${saved ? 'action-on' : ''}`} onClick={onSave}>{saved ? <Check size={17}/> : <Clock3 size={17}/>}<span>{saved ? 'Saved' : 'Save'}</span></button><button className="action-chip" onClick={onDownload}><Download size={17}/><span>Downloads</span></button></div></div><div className="description-box"><strong>{video.views} · {video.age}</strong><p>A moment to pause, get inspired, and find something lovely in the everyday. Settle in and enjoy the watch.</p><button onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank', 'noopener,noreferrer')}>Open on YouTube <ExternalLink size={13}/></button></div><div className="player-note"><ShieldCheck size={16}/><span>Playback is provided by YouTube. Picture-in-picture is available from the embedded player controls when supported by your browser.</span></div></div>
        <aside className="up-next"><div className="up-next-header"><div><span className="section-kicker">KEEP THE GOOD GOING</span><h3>Up next for you</h3></div><button className="autoplay-toggle" onClick={(e) => e.currentTarget.classList.toggle('autoplay-off')}><span/> Autoplay</button></div>{videos.filter((v) => v.id !== video.id).slice(0, 5).map((next) => <button className="up-next-item" key={next.id} onClick={() => onPlay(next)}><span className="up-next-thumb"><img src={imageUrl(next.image, 320)} alt=""/><span>{next.duration}</span></span><span className="up-next-copy"><strong>{next.title}</strong><small>{next.channel}</small><small>{next.views}</small></span><MoreHorizontal size={17}/></button>)}<div className="up-next-end"><Sparkles size={15}/> That’s a lovely little queue.</div></aside></div>
    </div>
  </div>;
}

function InfoDialog({ type, onClose }) {
  const content = type === 'account' ? { icon: <ShieldCheck size={21}/>, kicker: 'ACCOUNT CONNECTION', title: 'Your account, your choice.', body: 'Connect through Google’s official OAuth consent screen to access YouTube features. This demo does not collect passwords, browser cookies, session IDs, or private authorization headers.', action: 'Read OAuth setup guide', note: 'Account sync is not enabled in this demo. A trusted backend and a Google Cloud OAuth client are required before it can be added securely.' }
    : type === 'downloads' ? { icon: <Download size={21}/>, kicker: 'OFFLINE WATCHING', title: 'Take your favorites offline.', body: 'YouTube controls offline downloads inside its official app for eligible videos and Premium accounts. Infinity cannot download YouTube streams as MP4 files. Install Infinity to keep the app shell available offline; saved video listings do not include offline video playback.', action: 'Open YouTube', note: 'Downloads are subject to YouTube availability, account eligibility, and its app policies.' }
    : type === 'api' ? { icon: <Search size={21}/>, kicker: 'LIVE SEARCH SETUP', title: 'Connect YouTube search.', body: 'Create a Google Cloud project, enable YouTube Data API v3, and create an API key. Add it to a .env.local file in the project folder as VITE_YOUTUBE_API_KEY=your_key, then restart npm run dev.', action: 'Open Google Cloud', note: 'Restrict the key to YouTube Data API v3 and your website referrers, including localhost while developing. The key enables public search only; personal subscriptions need a separate OAuth flow.' }
    : { icon: <Sparkles size={21}/>, kicker: 'A NOTE FROM INFINITY', title: 'A calmer way to find a good watch.', body: 'Infinity is an independent interface concept built around the YouTube player. Videos play through YouTube’s privacy-enhanced embed. Watch history and saved items are stored in this browser and are not synced by Infinity.', action: 'Sounds good', note: 'Infinity is not affiliated with Google or YouTube.' };
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="info-modal"><button className="icon-button dialog-close" onClick={onClose} aria-label="Close"><X size={19}/></button><div className="dialog-icon">{content.icon}</div><div className="section-kicker">{content.kicker}</div><h2>{content.title}</h2><p className="dialog-body">{content.body}</p><div className="dialog-note"><ShieldCheck size={15}/>{content.note}</div><button className="dialog-action" onClick={() => { if (type === 'account') window.open('https://developers.google.com/youtube/v3/guides/authentication', '_blank', 'noopener,noreferrer'); if (type === 'downloads') window.open('https://www.youtube.com/', '_blank', 'noopener,noreferrer'); if (type === 'api') window.open('https://console.cloud.google.com/apis/library/youtube.googleapis.com', '_blank', 'noopener,noreferrer'); onClose(); }}>{content.action}{type === 'account' || type === 'downloads' || type === 'api' ? <ExternalLink size={15}/> : <ArrowRight size={15}/>}</button><button className="dialog-later" onClick={onClose}>Maybe later</button></div></div>;
}

export default App;
