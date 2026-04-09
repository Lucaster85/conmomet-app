"use client";
import React from "react";
import { Box, Card, Container, Typography } from "@mui/material";
import {
  AutoFixNormal,
  CabinOutlined,
  Engineering,
  FormatPaint,
  FrontLoader,
  Handyman,
  OpenInBrowser,
  RadioButtonChecked,
  VerticalAlignBottom,
} from "@mui/icons-material";

export default function FeaturesSection() {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h2" textAlign="center" sx={{ mb: 6 }}>
        Nuestros Servicios
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          justifyContent: "center",
        }}
      >
        <Card
          sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}
        >
          <FrontLoader sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Alquiler de Grúas
          </Typography>
          <Box component="ul" sx={{ textAlign: "left", color: "text.secondary", pl: 2, m: 0 }}>
            <Typography component="li" color="text.secondary">
              Plataforma unipersonal hasta 10 m de altura.
            </Typography>
            <Typography component="li" color="text.secondary">
              Grúas de 8 tn, 20 tn y 30 tn hasta 42 m de altura.
            </Typography>
          </Box>
        </Card>

        <Card
          sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}
        >
          <RadioButtonChecked
            sx={{ fontSize: 60, color: "primary.main", mb: 2 }}
          />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Torneria Industrial
          </Typography>
          <Typography color="text.secondary">
            Tornería de precisión para piezas y componentes personalizados.
          </Typography>
        </Card>

        <Card
          sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}
        >
          <VerticalAlignBottom
            sx={{ fontSize: 60, color: "primary.main", mb: 2 }}
          />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Corte y plegado de chapas de alta precisión
          </Typography>
          <Box component="ul" sx={{ textAlign: "left", color: "text.secondary", pl: 2, m: 0 }}>
            <Typography component="li" color="text.secondary">
              Corte con guillotina hasta 8 mm por 3200 mm.
            </Typography>
            <Typography component="li" color="text.secondary">
              Plegadora 125 tn por 3200 mm.
            </Typography>
          </Box>
        </Card>

        <Card
          sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}
        >
          <Handyman sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Mantenimiento de maquinarias industriales y reparación de equipos
          </Typography>
          <Typography color="text.secondary">
            Mano de obra calificada para trabajos mecánicos.
          </Typography>
        </Card>
        <Card
          sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}
        >
          <CabinOutlined sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Instalación y reparación de techos y cubiertas
          </Typography>
          <Typography color="text.secondary">
            Mano de obra calificada para trabajos de instalación y reparación de
            techos y cubiertas.
          </Typography>
        </Card>
        <Card
          sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}
        >
          <AutoFixNormal sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Soldadura
          </Typography>
          <Typography color="text.secondary">
            Soldadura de precisión, piezas únicas y series cortas para la
            industria.
          </Typography>
        </Card>
        <Card
          sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}
        >
          <FormatPaint sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Pintura y revestimiento de paredes y estructuras
          </Typography>
          <Typography color="text.secondary">
            Pintura y revestimiento de paredes y estructuras para la industria.
          </Typography>
        </Card>
        <Card
          sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}
        >
          <OpenInBrowser sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Traslado y posicionamiento de containers y cargas pesadas
          </Typography>
          <Typography color="text.secondary">
            Traslado y posicionamiento de containers y cargas pesadas para la
            industria.
          </Typography>
        </Card>
        <Card
          sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}
        >
          <Engineering sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Proyecto y dirección de obra, cálculos estructurales.
          </Typography>
          <Typography color="text.secondary">
            Proyectos y trabajos civiles y steel frame. Construcción de todo
            tipo de estructuras metálicas, galvanizadas en caliente y soldaduras
            de alta presión.
          </Typography>
        </Card>
      </Box>
    </Container>
  );
}
