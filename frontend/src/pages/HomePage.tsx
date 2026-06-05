import { Link } from 'react-router-dom'
import SocialLinks from '../components/SocialLinks'
import { demos } from '../config/demos'

const PROJECT_TITLE = 'NodeJS Sandbox'
const PROJECT_AUTHOR = 'Roman'
const PROJECT_TAGLINE = 'NestJS · React · PostgreSQL'

const techStack = [
  'NestJS & TypeScript on the backend',
  'Prisma ORM with PostgreSQL on Neon (production)',
  'REST API, DTOs, class-validator, and @nestjs/throttler',
  'JWT access & refresh tokens, guards, and roles',
  'React, Vite, and React Router on the frontend',
  'CORS tuned for Vercel previews and production',
  'Docker Compose for local PostgreSQL during development',
  'Deployed on Vercel (frontend), Render (API), and Neon (database)',
]

export default function HomePage() {
  return (
    <div className="home">
      <div className="home__title-row">
        <div className="home__title-block">
          <h1 className="home__title">
            {PROJECT_TITLE}{' '}
            <span className="home__by">by {PROJECT_AUTHOR}</span>
          </h1>
          <p className="home__tagline">{PROJECT_TAGLINE}</p>
        </div>
        <SocialLinks />
      </div>
      <p className="home__lead">
        A portfolio sandbox for backend patterns, API demos, and full-stack
        experiments. Pick a demo below to explore a focused slice of the stack.
      </p>

      <section className="home__section">
        <h2 className="home__section-title">Stack & patterns</h2>
        <ul className="home__tech-list">
          {techStack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="home__section">
        <h2 className="home__section-title">Demos</h2>
        <ul className="demo-list">
          {demos.map((demo) => (
            <li key={demo.id} className="demo-list__item">
              {demo.available ? (
                <Link to={demo.path} className="demo-card demo-card--active">
                  <span className="demo-card__title">{demo.title}</span>
                  <span className="demo-card__summary">{demo.summary}</span>
                </Link>
              ) : (
                <div className="demo-card demo-card--soon" aria-disabled="true">
                  <span className="demo-card__title">
                    {demo.title}
                    <span className="demo-card__badge">Coming soon</span>
                  </span>
                  <span className="demo-card__summary">{demo.summary}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
