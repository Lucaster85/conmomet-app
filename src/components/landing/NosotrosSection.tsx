"use client";
import React from "react";
import { Box, Container, Typography } from "@mui/material";

const paragraphs = [
  "En CONOMET S.A. somos un equipo apasionado y experimentado en la construcción y montaje de estructuras metálicas. Con una sólida trayectoria en el sector, nos destacamos por nuestro compromiso con la calidad, la seguridad y la eficiencia.",
  "Nuestros técnicos y operarios están altamente capacitados y cuentan con la experiencia necesaria para abordar proyectos complejos y personalizados. Contamos con una flota de maquinaria de última generación, incluyendo pantógrafo, guillotina, plegadora y grúas con capacidades de hasta 30 toneladas, lo que nos permite ofrecer soluciones integrales y flexibles a nuestros clientes.",
  "Nuestra misión es brindar soluciones de alta calidad y valor agregado a nuestros clientes, trabajando de manera segura, eficiente y comprometida con la excelencia. En CONMOMET S.A. nos enfocamos en construir relaciones duraderas con nuestros clientes y en contribuir al éxito de sus proyectos con nuestra experiencia y dedicación.",
];

export default function NosotrosSection() {
  return (
    <Box sx={{ bgcolor: "grey.50", py: { xs: 7, md: 11 } }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: { xs: 5, md: 8 } }}>
          <Typography
            variant="overline"
            color="primary"
            sx={{ letterSpacing: 4, fontSize: "0.8rem", fontWeight: 600 }}
          >
            Quiénes Somos
          </Typography>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, mt: 1, mb: 2, fontSize: { xs: "2rem", md: "2.75rem" } }}
          >
            Nosotros
          </Typography>
          <Box
            sx={{
              width: 56,
              height: 4,
              bgcolor: "primary.main",
              mx: "auto",
              borderRadius: 2,
            }}
          />
        </Box>

        {/* Paragraphs */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 4, md: 5 },
            mb: { xs: 5, md: 7 },
          }}
        >
          {paragraphs.map((text, i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                borderLeft: "3px solid",
                borderColor: "primary.main",
                pl: 3,
                py: 0.5,
              }}
            >
              <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
                {text}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Tagline */}
        <Box
          sx={{
            textAlign: "center",
            py: { xs: 3, md: 4 },
            px: { xs: 2, md: 6 },
            borderRadius: 3,
            bgcolor: "primary.main",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "white",
              fontSize: { xs: "1.15rem", md: "1.5rem" },
            }}
          >
            ¡Confía en nosotros para llevar tus proyectos al éxito!
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
