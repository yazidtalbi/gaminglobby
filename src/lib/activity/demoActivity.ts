export interface DemoLobbyItem {
  id: string
  title: string
  game_name: string
  platform: string
  region: string
  players: string
  recency: string
  is_demo: true
}

export interface DemoPlayerItem {
  id: string
  username: string
  display_name: string
  game_name: string
  platform: string
  region: string
  recency: string
  is_demo: true
}

export interface DemoGameItem {
  id: string
  name: string
  lobbies_count: string
  players_count: string
  recency: string
  is_demo: true
}

export const demoLobbies: DemoLobbyItem[] = [
  {
    id: 'demo-1',
    title: 'Ranked 5v5',
    game_name: 'Counter-Strike 2',
    platform: 'PC',
    region: 'EU',
    players: '7/10',
    recency: '2m ago',
    is_demo: true,
  },
  {
    id: 'demo-2',
    title: 'Casual DM',
    game_name: 'Counter-Strike 2',
    platform: 'PC',
    region: 'NA',
    players: '4/8',
    recency: '5m ago',
    is_demo: true,
  },
  {
    id: 'demo-3',
    title: 'Wingman',
    game_name: 'Counter-Strike 2',
    platform: 'PC',
    region: 'OCE',
    players: '1/2',
    recency: '12m ago',
    is_demo: true,
  },
  {
    id: 'demo-4',
    title: 'Payload',
    game_name: 'Team Fortress 2',
    platform: 'PC',
    region: 'EU',
    players: '12/24',
    recency: '8m ago',
    is_demo: true,
  },
  {
    id: 'demo-5',
    title: 'Competitive',
    game_name: 'Team Fortress 2',
    platform: 'PC',
    region: 'NA',
    players: '6/12',
    recency: '15m ago',
    is_demo: true,
  },
  {
    id: 'demo-6',
    title: 'Conquest',
    game_name: 'Battlefield 3',
    platform: 'PC',
    region: 'EU',
    players: '32/64',
    recency: '3m ago',
    is_demo: true,
  },
  {
    id: 'demo-7',
    title: 'Rush',
    game_name: 'Battlefield 3',
    platform: 'PC',
    region: 'NA',
    players: '24/32',
    recency: '18m ago',
    is_demo: true,
  },
  {
    id: 'demo-8',
    title: 'Versus',
    game_name: 'Left 4 Dead 2',
    platform: 'PC',
    region: 'EU',
    players: '8/8',
    recency: '6m ago',
    is_demo: true,
  },
  {
    id: 'demo-9',
    title: 'Campaign',
    game_name: 'Left 4 Dead 2',
    platform: 'PC',
    region: 'NA',
    players: '3/4',
    recency: '22m ago',
    is_demo: true,
  },
  {
    id: 'demo-10',
    title: 'Duel',
    game_name: 'Quake',
    platform: 'PC',
    region: 'EU',
    players: '2/2',
    recency: '4m ago',
    is_demo: true,
  },
]

export const demoPlayers: DemoPlayerItem[] = [
  {
    id: 'demo-p1',
    username: 'alex_gamer',
    display_name: 'Alex',
    game_name: 'Counter-Strike 2',
    platform: 'PC',
    region: 'EU',
    recency: '2m ago',
    is_demo: true,
  },
  {
    id: 'demo-p2',
    username: 'sam_plays',
    display_name: 'Sam',
    game_name: 'Counter-Strike 2',
    platform: 'PC',
    region: 'NA',
    recency: '5m ago',
    is_demo: true,
  },
  {
    id: 'demo-p3',
    username: 'jordan_lfg',
    display_name: 'Jordan',
    game_name: 'Team Fortress 2',
    platform: 'PC',
    region: 'OCE',
    recency: '8m ago',
    is_demo: true,
  },
  {
    id: 'demo-p4',
    username: 'taylor_fps',
    display_name: 'Taylor',
    game_name: 'Battlefield 3',
    platform: 'PC',
    region: 'EU',
    recency: '12m ago',
    is_demo: true,
  },
  {
    id: 'demo-p5',
    username: 'morgan_shooter',
    display_name: 'Morgan',
    game_name: 'Left 4 Dead 2',
    platform: 'PC',
    region: 'NA',
    recency: '15m ago',
    is_demo: true,
  },
  {
    id: 'demo-p6',
    username: 'casey_quake',
    display_name: 'Casey',
    game_name: 'Quake',
    platform: 'PC',
    region: 'EU',
    recency: '3m ago',
    is_demo: true,
  },
  {
    id: 'demo-p7',
    username: 'riley_arena',
    display_name: 'Riley',
    game_name: 'Counter-Strike 2',
    platform: 'PC',
    region: 'EU',
    recency: '7m ago',
    is_demo: true,
  },
  {
    id: 'demo-p8',
    username: 'drew_comp',
    display_name: 'Drew',
    game_name: 'Team Fortress 2',
    platform: 'PC',
    region: 'NA',
    recency: '20m ago',
    is_demo: true,
  },
]

export const demoGames: DemoGameItem[] = [
  {
    id: 'demo-g1',
    name: 'Counter-Strike 2',
    lobbies_count: '3',
    players_count: '12',
    recency: '2m ago',
    is_demo: true,
  },
  {
    id: 'demo-g2',
    name: 'Team Fortress 2',
    lobbies_count: '2',
    players_count: '18',
    recency: '8m ago',
    is_demo: true,
  },
  {
    id: 'demo-g3',
    name: 'Battlefield 3',
    lobbies_count: '2',
    players_count: '56',
    recency: '3m ago',
    is_demo: true,
  },
  {
    id: 'demo-g4',
    name: 'Left 4 Dead 2',
    lobbies_count: '2',
    players_count: '11',
    recency: '6m ago',
    is_demo: true,
  },
  {
    id: 'demo-g5',
    name: 'Quake',
    lobbies_count: '1',
    players_count: '2',
    recency: '4m ago',
    is_demo: true,
  },
  {
    id: 'demo-g6',
    name: 'Doom',
    lobbies_count: '1',
    players_count: '4',
    recency: '25m ago',
    is_demo: true,
  },
]
