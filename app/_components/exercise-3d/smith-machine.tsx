"use client";

/**
 * Representação 3D estrutural e mecânica de uma Máquina Smith de musculação.
 * Estrutura estacionária:
 * - Colunas verticais estruturais em aço carbono escuro (#1e293b / #334155).
 * - Trilhos guias cilíndricos em aço polido cromado nos quais a barra desliza.
 * - Pés de base longitudinal no solo com sapatas antiderrapantes de borracha.
 * - Travessão superior de reforço estrutural com acabamento Trainvy.
 * - Travas de segurança inferiores reguláveis com molas amortecedoras.
 * - Pinos/dentes de engate ao longo de cada coluna para travamento dos ganchos da barra.
 */
export function SmithMachineFrame() {
  const railX = 0.75;
  const railZ = -0.035;
  const columnZ = -0.11;
  const hookPegHeights = [
    0.65, 0.77, 0.89, 1.01, 1.13, 1.25, 1.37, 1.49, 1.61, 1.73, 1.85,
  ];

  return (
    <group>
      {/* Trilhos Guia Verticais de Aço Cromado Polido (onde os mancais da barra deslizam) */}
      {[-railX, railX].map((x) => (
        <group key={`rail-${x}`}>
          {/* Haste de guia cilíndrica */}
          <mesh position={[x, 1.05, railZ]} castShadow>
            <cylinderGeometry args={[0.013, 0.013, 2.0, 24]} />
            <meshStandardMaterial
              color="#e2e8f0"
              metalness={0.92}
              roughness={0.16}
            />
          </mesh>

          {/* Suportes/Abraçadeiras de fixação da haste (superior e inferior) */}
          <mesh position={[x, 2.04, (railZ + columnZ) / 2]} castShadow>
            <boxGeometry
              args={[0.05, 0.04, Math.abs(railZ - columnZ) + 0.04]}
            />
            <meshStandardMaterial
              color="#334155"
              metalness={0.75}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[x, 0.07, (railZ + columnZ) / 2]} castShadow>
            <boxGeometry
              args={[0.05, 0.04, Math.abs(railZ - columnZ) + 0.04]}
            />
            <meshStandardMaterial
              color="#334155"
              metalness={0.75}
              roughness={0.3}
            />
          </mesh>

          {/* Batentes/Travas de Segurança Inferiores com Molas Amortecedoras */}
          <group position={[x, 0.56, railZ]}>
            {/* Colar de travamento anodizado */}
            <mesh position={[0, 0.03, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.04, 20]} />
              <meshStandardMaterial
                color="#f97316"
                metalness={0.65}
                roughness={0.35}
              />
            </mesh>
            {/* Mola de absorção de impacto */}
            <mesh position={[0, -0.02, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.06, 16]} />
              <meshStandardMaterial
                color="#94a3b8"
                metalness={0.88}
                roughness={0.25}
              />
            </mesh>
          </group>
        </group>
      ))}

      {/* Colunas Estruturais Verticais Principais (tubo quadrado 80x80mm) */}
      {[-railX, railX].map((x) => (
        <group key={`column-${x}`}>
          <mesh position={[x, 1.05, columnZ]} castShadow receiveShadow>
            <boxGeometry args={[0.08, 2.06, 0.08]} />
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.75}
              roughness={0.3}
            />
          </mesh>

          {/* Dentes / Pinos de engate para os ganchos da barra (safety pegs) */}
          {hookPegHeights.map((y) => (
            <mesh
              key={`peg-${x}-${y}`}
              position={[x, y, columnZ + 0.048]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.008, 0.008, 0.028, 14]} />
              <meshStandardMaterial
                color="#cbd5e1"
                metalness={0.88}
                roughness={0.2}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Pés de Base Longitudinal no Solo (com sapatas emborrachadas) */}
      {[-railX, railX].map((x) => (
        <group key={`base-foot-${x}`}>
          <mesh position={[x, 0.035, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.08, 0.07, 1.2]} />
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.7}
              roughness={0.35}
            />
          </mesh>
          {/* Sapatas antiderrapantes de borracha nas extremidades */}
          {[-0.56, 0.56].map((z) => (
            <mesh key={`foot-pad-${x}-${z}`} position={[x, 0.01, z]}>
              <boxGeometry args={[0.09, 0.02, 0.1]} />
              <meshStandardMaterial color="#0b0f17" roughness={0.92} />
            </mesh>
          ))}
          {/* Mão-francesa de reforço angular na base da coluna */}
          <mesh
            position={[x, 0.16, columnZ - 0.14]}
            rotation={[Math.PI / 4, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.05, 0.32, 0.05]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.7}
              roughness={0.35}
            />
          </mesh>
        </group>
      ))}

      {/* Barra Transversal de Base Traseira */}
      <mesh position={[0, 0.04, columnZ - 0.28]} castShadow>
        <boxGeometry args={[railX * 2, 0.06, 0.06]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>

      {/* Travessão Superior Estrutural de Reforço */}
      <mesh position={[0, 2.06, columnZ]} castShadow>
        <boxGeometry args={[railX * 2 + 0.08, 0.08, 0.08]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>
      {/* Placa decorativa central com friso Trainvy */}
      <mesh position={[0, 2.06, columnZ + 0.042]}>
        <boxGeometry args={[0.4, 0.05, 0.004]} />
        <meshStandardMaterial
          color="#f97316"
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}

/**
 * Barra Guiada da Máquina Smith:
 * Contém a barra de 2.2m com mangas olímpicas e anilhas, além dos mancais deslizantes
 * com rolamentos lineares (linear bearing collars) que encapsulam as guias e os
 * ganchos de segurança que engatam nos dentes da coluna ao girar os punhos.
 */
export function SmithBarbell() {
  const railX = 0.75;

  return (
    <group>
      {/* Barra Olímpica Central Cromada */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 2.2, 24]} />
        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.9}
          roughness={0.18}
        />
      </mesh>

      {/* Mancais Deslizantes / Rolamentos Lineares que abraçam os trilhos guias */}
      {[-railX, railX].map((x) => (
        <group key={`bushing-${x}`} position={[x, 0, 0]}>
          {/* Corpo cilíndrico do mancal deslizante */}
          <mesh castShadow>
            <cylinderGeometry args={[0.026, 0.026, 0.14, 24]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
          {/* Anéis de vedação e usinagem CNC */}
          {[-0.065, 0.065].map((y) => (
            <mesh key={`seal-${y}`} position={[0, y, 0]}>
              <cylinderGeometry args={[0.028, 0.028, 0.012, 24]} />
              <meshStandardMaterial
                color="#0f172a"
                roughness={0.8}
                metalness={0.2}
              />
            </mesh>
          ))}
          {/* Gancho de travamento da barra (rotacionado em direção aos dentes da coluna) */}
          <mesh position={[0, -0.015, -0.032]} castShadow>
            <boxGeometry args={[0.018, 0.05, 0.042]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, -0.042, -0.018]} castShadow>
            <boxGeometry args={[0.018, 0.014, 0.02]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* Mangas e Anilhas de cada lado */}
      {[-1, 1].map((side) => (
        <group key={`plates-${side}`} position={[side * 0.88, 0, 0]}>
          {/* Anilha Principal Olímpica (Laranja Trainvy) */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.06, 44]} />
            <meshStandardMaterial
              color="#f97316"
              roughness={0.5}
              metalness={0.2}
            />
          </mesh>
          {/* Relevo central da anilha */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.065, 36]} />
            <meshStandardMaterial
              color="#ea580c"
              roughness={0.6}
              metalness={0.15}
            />
          </mesh>
          {/* Anel central de aço */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.048, 0.048, 0.075, 24]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.85}
              roughness={0.2}
            />
          </mesh>
          {/* Presilha / Colarinho */}
          <mesh position={[side * 0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.035, 20]} />
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
