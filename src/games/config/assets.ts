import { AssetDto } from '@assets/dto'
import { AssetType } from '@assets/interface'

export const assets: Omit<AssetDto, 'status'>[] = [
  {
    name: 'Attack Vector',
    type: AssetType.Attack,
    effectDescription:
      'Opens up one of the following attack vectors: GCQH - Rosenergoatom, SCS - UK Energy, UK Government - Russian Government.',
    minimumBid: 5,
  },
  {
    name: 'Attack Vector',
    type: AssetType.Attack,
    effectDescription:
      'Opens up one of the following attack vectors: GCQH - Rosenergoatom, SCS - UK Energy, UK Government - Russian Government.',
    minimumBid: 5,
  },
  {
    name: 'Education',
    type: AssetType.Defence,
    effectDescription: 'Electorate suffers only half of any damage it receives for the nest 3 turns.',
    minimumBid: 3,
  },
  {
    name: 'Recovery Management',
    type: AssetType.Defence,
    effectDescription: 'At the end of a turn, if UK PLC has suffered any damage, they receive +1 Vitality.',
    minimumBid: 4,
  },
  {
    name: 'Software Update',
    type: AssetType.Defence,
    effectDescription: 'Renders UK PLC or UK Energy or Rosenergoatom immune to direct attack for 2 turns.',
    minimumBid: 2,
  },
  {
    name: 'Software Update',
    type: AssetType.Defence,
    effectDescription: 'Renders UK PLC or UK Energy or Rosenergoatom immune to direct attack for 2 turns.',
    minimumBid: 2,
  },
  {
    name: 'Bargaining Chip',
    type: AssetType.Defence,
    effectDescription: 'Russian Government suffers only half of any damage it receives for the next 3 turns.',
    minimumBid: 3,
  },
  {
    name: 'Network Policy',
    type: AssetType.Defence,
    effectDescription:
      'Renders Entity immune from splash damage, but only 2 Resource can be transferred to or from it each turn.',
    minimumBid: 2,
  },
  {
    name: 'Network Policy',
    type: AssetType.Defence,
    effectDescription:
      'Renders Entity immune from splash damage, but only 2 Resource can be transferred to or from it each turn.',
    minimumBid: 2,
  },
  {
    name: 'Stuxnet 2.0',
    type: AssetType.Attack,
    effectDescription: 'Direct attack from GCHQ/SCS deals double damage to UK Energy or Rosenergoatom (one-time use).',
    minimumBid: 4,
  },
  {
    name: 'Stuxnet 2.0',
    type: AssetType.Attack,
    effectDescription: 'Direct attack from GCHQ/SCS deals double damage to UK Energy or Rosenergoatom (one-time use).',
    minimumBid: 4,
  },
  {
    name: 'Stuxnet 2.0',
    type: AssetType.Attack,
    effectDescription: 'Direct attack from GCHQ/SCS deals double damage to UK Energy or Rosenergoatom (one-time use).',
    minimumBid: 4,
  },
  {
    name: 'Ransomware',
    type: AssetType.Attack,
    effectDescription:
      'When part of successful direct attack, paralyses UK PLC or Electorate for 2 turns unless 2 Resource is paid to attacker (one-time use).',
    minimumBid: 3,
  },
  {
    name: 'Ransomware',
    type: AssetType.Attack,
    effectDescription:
      'When part of successful direct attack, paralyses UK PLC or Electorate for 2 turns unless 2 Resource is paid to attacker (one-time use).',
    minimumBid: 3,
  },
  {
    name: 'Cyber Investment Programme',
    type: AssetType.Defence,
    effectDescription: 'Entity may regenerate Vitality at 1 less Resource cost than normal.',
    minimumBid: 3,
  },
  {
    name: 'Cyber Investment Programme',
    type: AssetType.Defence,
    effectDescription: 'Entity may regenerate Vitality at 1 less Resource cost than normal.',
    minimumBid: 3,
  },
]
