'use client'

import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

export default function TestEntitySearch() {
  const [allEntities, setAllEntities] = useState<{
    characters: any[]
    arcs: any[]
    gambles: any[]
    quotes: any[]
  }>({
    characters: [],
    arcs: [],
    gambles: [],
    quotes: []
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Load entities
  useEffect(() => {
    const loadAllEntities = async () => {
      try {
        const [charactersRes, arcsRes, gamblesRes, quotesRes] = await Promise.all([
          api.getCharacters({ limit: 100 }),
          api.getArcs({ limit: 100 }),
          api.getGambles({ limit: 100 }),
          api.getQuotes({ limit: 100 })
        ])
        
        setAllEntities({
          characters: charactersRes.data || [],
          arcs: arcsRes.data || [],
          gambles: gamblesRes.data || [],
          quotes: quotesRes.data || []
        })
        
        console.log('Entities loaded:', {
          characters: charactersRes.data?.length || 0,
          arcs: arcsRes.data?.length || 0,
          gambles: gamblesRes.data?.length || 0,
          quotes: quotesRes.data?.length || 0
        })
      } catch (error) {
        console.error('Error loading entities:', error)
      }
    }

    loadAllEntities()
  }, [])

  // Search function
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }

    const results: any[] = []
    const searchLower = query.toLowerCase()

    // Search characters
    const matchingCharacters = allEntities.characters
      .filter(c => c.name.toLowerCase().includes(searchLower))
      .map(c => ({
        id: c.id,
        name: c.name,
        type: 'character',
        data: c
      }))
    results.push(...matchingCharacters.slice(0, 5))

    // Search arcs
    const matchingArcs = allEntities.arcs
      .filter(a => a.name.toLowerCase().includes(searchLower))
      .map(a => ({
        id: a.id,
        name: a.name,
        type: 'arc',
        data: a
      }))
    results.push(...matchingArcs.slice(0, 5))

    // Search gambles
    const matchingGambles = allEntities.gambles
      .filter(g => g.name.toLowerCase().includes(searchLower))
      .map(g => ({
        id: g.id,
        name: g.name,
        type: 'gamble',
        data: g
      }))
    results.push(...matchingGambles.slice(0, 5))

    // Search quotes
    const matchingQuotes = allEntities.quotes
      .filter(q => 
        q.text.toLowerCase().includes(searchLower) ||
        q.character?.name.toLowerCase().includes(searchLower)
      )
      .map(q => ({
        id: q.id,
        name: q.text.substring(0, 50) + (q.text.length > 50 ? '...' : ''),
        type: 'quote',
        data: q
      }))
    results.push(...matchingQuotes.slice(0, 3))

    setSearchResults(results)
    console.log('Search results for "' + query + '":', results)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Entity Search Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Loaded Entities:</h3>
        <ul>
          <li>Characters: {allEntities.characters.length}</li>
          <li>Arcs: {allEntities.arcs.length}</li>
          <li>Gambles: {allEntities.gambles.length}</li>
          <li>Quotes: {allEntities.quotes.length}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search entities (try 'baku', 'arc', 'air'...)"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>

      <div>
        <h3>Search Results ({searchResults.length}):</h3>
        {searchResults.length === 0 ? (
          <p>No results found</p>
        ) : (
          <ul>
            {searchResults.map((result, index) => (
              <li key={`${result.type}-${result.id}-${index}`} style={{ marginBottom: '10px' }}>
                <strong>{result.type}:</strong> {result.name}
                {result.type === 'quote' && result.data.character && (
                  <span> (by {result.data.character.name})</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
