import { Pipe, PipeTransform } from '@angular/core';
import { filter as fuzz } from 'fuzzaldrin';
import { chain, Dictionary, filter, get, groupBy, map } from 'lodash';
import { Collection } from '../data';
import { CardClass, JSONCard, Rarity, ShortRarity } from '../data/types';
import { Search } from '../search/bar/search-bar';
import { KeywordTypes, Range, SearchTerm } from '../search/parse/search.grammar';

type Card = JSONCard;
type Predicate = (data: (string | Range), card: Card, coll: Collection, keywords: Dictionary<SearchTerm[]>) => boolean;

@Pipe({
  name: 'prCollectionFilter'
})
export class CollectionFilterPipe implements PipeTransform {
  transform(cards: Card[], collection: Collection, search: Search) {
    if (search.text) {
      if (!search.sts) {
        return [{
          name: 'Invalid search'
        }];
      }

      const types = groupBy(search.sts, 'type');

      if (types.word) {
        const words = map(types.word, 'query');

        cards = fuzz(cards, words.join(' '), { key: 'name' });
      }

      if (types.keyword) {
        const groups: (c: JSONCard) => boolean = chain(types.keyword)
          .groupBy('query.type')
          .mapValues((a: SearchTerm[]) => map(a, 'query.data'))
          .mapValues((a: (string | Range)[], t: KeywordTypes, gs: Dictionary<SearchTerm[]>) => {
            return chain(a)
              .map((data) => {
                return (card: Card) => CollectionFilterPipe.predicates[t](data, card, collection, gs);
              })
              .overSome()
              .value();
          })
          .values()
          .overEvery()
          .value();

        cards = filter(cards, groups);
      }

      if (!cards.length) {
        return [{
          name: 'No results'
        }];
      }
    }

    return cards;
  }

  static predicates: Dictionary<Predicate> = {
    'binary/rarity': (data: ShortRarity, card: Card, _coll: Collection, _keywords: Dictionary<SearchTerm[]>) => {
      return data === Rarity.short(card.rarity);
    },
    'binary/class': (data: CardClass, card: Card, _coll: Collection, _keywords: Dictionary<SearchTerm[]>) => {
      return card.multiClassGroup === data || card.playerClass === data;
    },
    'binary/golden': (_data, card: Card, coll: Collection, keywords: Dictionary<SearchTerm[]>) => {
      const handled = 'binary/extra' in keywords || 'binary/missing' in keywords || 'ranged/owned' in keywords;
      return handled || get(coll, [card.name, 'gold']) > 0;
    },
    'binary/extra': (_data, card: Card, coll: Collection, keywords: Dictionary<SearchTerm[]>) => {
      const count = CollectionFilterPipe.getCount(card, coll, 'binary/golden' in keywords);
      return count > Rarity.max(Rarity.short(card.rarity));
    },
    'binary/missing': (_data, card: Card, coll: Collection, keywords: Dictionary<SearchTerm[]>) => {
      const count = CollectionFilterPipe.getCount(card, coll, 'binary/golden' in keywords);
      return count < Rarity.max(Rarity.short(card.rarity));
    },
    'ranged/owned': (data: Range, card: Card, coll: Collection, keywords: Dictionary<SearchTerm[]>) => {
      const count = CollectionFilterPipe.getCount(card, coll, 'binary/golden' in keywords);
      return data.min <= count && count <= data.max;
    },
    'ranged/mana': (data: Range, card: Card, _coll: Collection, _keywords: Dictionary<SearchTerm[]>) => {
      return data.min <= card.cost && card.cost <= data.max;
    }
  };

  static getCount({ name }: Card, coll: Collection, golden: any): number {
    let count = 0;
    if (!golden) {
      count += get(coll, [name, 'norm'], 0);
    }
    count += get(coll, [name, 'gold'], 0);

    return count;
  }  
}
