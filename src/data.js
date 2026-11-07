export const videos = [
  { id: 'L_jWHffIx5E', title: 'A little reminder to slow down', channel: 'Maya in Motion', verified: true, views: '2.4M views', age: '3 days ago', duration: '18:42', category: 'Mindful living', image: 'photo-1470770841072-f978cf4d019e', avatar: 'M', tone: 'violet' },
  { id: 'hT_nvWreIhg', title: 'The art of doing nothing (and why it matters)', channel: 'The Sunday Edit', verified: true, views: '846K views', age: '1 week ago', duration: '12:08', category: 'Culture', image: 'photo-1470252649378-9c29740c9fa8', avatar: 'S', tone: 'peach' },
  { id: 'M7lc1UVf-VE', title: 'Building a tiny cabin in the woods — start to finish', channel: 'Northwood Workshop', verified: false, views: '5.1M views', age: '2 weeks ago', duration: '34:16', category: 'Design', image: 'photo-1449158743715-0a90ebb6d2d8', avatar: 'N', tone: 'mint' },
  { id: 'kJQP7kiw5Fk', title: 'Sunday morning jazz for slow starts', channel: 'Soft Hours', verified: true, views: '18M views', age: '4 months ago', duration: '1:02:41', category: 'Music', image: 'photo-1519681393784-d120267933ba', avatar: 'S', tone: 'blue' },
  { id: 'dQw4w9WgXcQ', title: 'What I learned after 30 days offline', channel: 'Theo Park', verified: false, views: '392K views', age: '2 days ago', duration: '21:35', category: 'Mindful living', image: 'photo-1500530855697-b586d89ba3ee', avatar: 'T', tone: 'amber' },
  { id: 'fLexgOxsZu0', title: 'A quiet walk through Copenhagen in spring', channel: 'Elsewhere', verified: true, views: '1.2M views', age: '5 days ago', duration: '26:04', category: 'Travel', image: 'photo-1513622470522-26c3c8a854bc', avatar: 'E', tone: 'rose' },
  { id: 'jNQXAC9IVRw', title: 'A recipe worth keeping: Sunday focaccia', channel: 'Olive & Rye', verified: false, views: '721K views', age: '6 days ago', duration: '14:52', category: 'Food', image: 'photo-1509440159596-0249088772ff', avatar: 'O', tone: 'orange' },
  { id: 'ysz5S6PUM-U', title: 'Inside a home designed around the light', channel: 'Open House', verified: true, views: '2.8M views', age: '3 weeks ago', duration: '16:20', category: 'Design', image: 'photo-1600210492486-724fe5c67fb0', avatar: 'O', tone: 'sage' },
  { id: 'ScMzIvxBSi4', title: 'The beautiful science of a good night’s sleep', channel: 'Good Things Lab', verified: true, views: '958K views', age: '10 days ago', duration: '11:47', category: 'Learning', image: 'photo-1519681393784-d120267933ba', avatar: 'G', tone: 'navy' },
  { id: 'aqz-KE-bpKQ', title: 'Finding the best light in the city', channel: 'Film Notes', verified: false, views: '129K views', age: '1 day ago', duration: '09:16', category: 'Travel', image: 'photo-1519608487953-e999c86e7455', avatar: 'F', tone: 'purple' },
  { id: 'CevxZvSJLk8', title: 'My favorite books from the last five years', channel: 'Paper Trails', verified: false, views: '2.1M views', age: '1 month ago', duration: '19:03', category: 'Culture', image: 'photo-1507842217343-583bb7270b66', avatar: 'P', tone: 'brown' },
  { id: '9bZkp7q19f0', title: 'Making space for a more creative life', channel: 'Mina Le', verified: true, views: '4.7M views', age: '2 months ago', duration: '23:51', category: 'Learning', image: 'photo-1497366754035-f200968a6e72', avatar: 'M', tone: 'coral' }
];

export const categories = ['All', 'Music', 'Culture', 'Design', 'Travel', 'Mindful living', 'Food', 'Learning'];

export const imageUrl = (id, width = 700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
